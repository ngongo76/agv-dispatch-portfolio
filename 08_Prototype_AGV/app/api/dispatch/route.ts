import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createTask, getZones } from "@/lib/engine";

// FR-L1/L2/L3 (UC14, US-22, US-23) — AI Dispatcher: nhận lệnh ngôn ngữ tự nhiên,
// diễn giải thành task hợp lệ, và đi qua đúng luồng tạo task chuẩn (không bypass validation).

const TOOL_NAME = "create_transport_task";

function buildZoneContext() {
  return getZones()
    .map((z) => `- ${z.zone_id}: ${z.name} (loại: ${z.zone_type})`)
    .join("\n");
}

export async function POST(req: Request) {
  const { message } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Thiếu nội dung lệnh" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Chưa cấu hình ANTHROPIC_API_KEY trong .env.local — xem README để lấy API key.",
      },
      { status: 500 }
    );
  }

  const client = new Anthropic({ apiKey });
  const zoneList = getZones().map((z) => z.zone_id);

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 512,
      system: `Bạn là AI Dispatcher cho hệ thống điều phối AGV trong kho.
Nhiệm vụ: đọc lệnh vận chuyển bằng ngôn ngữ tự nhiên (tiếng Việt hoặc tiếng Anh) của nhân viên kho,
và gọi tool "${TOOL_NAME}" để tạo task hợp lệ.

Danh sách khu vực hợp lệ trong kho (chỉ được dùng đúng zone_id này, không được bịa ra zone_id khác):
${buildZoneContext()}

Quy tắc bắt buộc (FR-L3, US-23):
- Nếu lệnh không nêu rõ điểm lấy hàng HOẶC điểm giao hàng, KHÔNG được tự đoán — thay vào đó set needs_clarification=true và viết câu hỏi lại rõ ràng bằng tiếng Việt trong clarification_question.
- Chỉ set priority="urgent" khi người dùng thể hiện rõ ý gấp/khẩn cấp (từ như "gấp", "khẩn", "ngay", "urgent"). Mặc định là "normal".
- Luôn gọi tool, không trả lời bằng văn bản thường.`,
      tools: [
        {
          name: TOOL_NAME,
          description:
            "Tạo một task vận chuyển AGV hợp lệ, hoặc yêu cầu người dùng làm rõ nếu thiếu thông tin.",
          input_schema: {
            type: "object",
            properties: {
              needs_clarification: {
                type: "boolean",
                description: "true nếu lệnh thiếu điểm lấy hoặc điểm giao rõ ràng",
              },
              clarification_question: {
                type: "string",
                description: "Câu hỏi lại bằng tiếng Việt nếu needs_clarification=true",
              },
              pickup_zone_id: {
                type: "string",
                enum: zoneList,
                description: "Bắt buộc nếu needs_clarification=false",
              },
              dropoff_zone_id: {
                type: "string",
                enum: zoneList,
                description: "Bắt buộc nếu needs_clarification=false",
              },
              priority: { type: "string", enum: ["normal", "urgent"] },
              reasoning: {
                type: "string",
                description: "Giải thích ngắn gọn lý do diễn giải lệnh như vậy (hiển thị cho người dùng)",
              },
            },
            required: ["needs_clarification", "reasoning"],
          },
        },
      ],
      tool_choice: { type: "tool", name: TOOL_NAME },
      messages: [{ role: "user", content: message }],
    });

    const toolUse = response.content.find((c) => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json(
        { error: "AI Dispatcher không trả về kết quả hợp lệ, thử lại." },
        { status: 502 }
      );
    }

    const input = toolUse.input as {
      needs_clarification: boolean;
      clarification_question?: string;
      pickup_zone_id?: string;
      dropoff_zone_id?: string;
      priority?: "normal" | "urgent";
      reasoning?: string;
    };

    if (input.needs_clarification) {
      return NextResponse.json({
        needs_clarification: true,
        question: input.clarification_question || "Bạn có thể nói rõ hơn điểm lấy/giao hàng không?",
        reasoning: input.reasoning,
      });
    }

    if (!input.pickup_zone_id || !input.dropoff_zone_id) {
      return NextResponse.json({
        needs_clarification: true,
        question: "Mình chưa xác định được điểm lấy hoặc điểm giao, bạn nói rõ hơn nhé?",
      });
    }

    const task = createTask(
      input.pickup_zone_id,
      input.dropoff_zone_id,
      input.priority === "urgent" ? "urgent" : "normal",
      "ai-agent",
      input.reasoning
    );

    return NextResponse.json({ needs_clarification: false, task, reasoning: input.reasoning });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Lỗi gọi AI Dispatcher: ${err.message}` },
      { status: 500 }
    );
  }
}
