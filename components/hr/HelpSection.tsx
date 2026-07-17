
import { HelpCircle } from "lucide-react";

type HelpSectionProps = {
  mode?: "create" | "edit";
  entityName?: string;
};

export function HelpSection({
  mode = "create",
  entityName = "ข้อมูล",
}: HelpSectionProps) {
  return (
    <div className="p-8 pt-0">
      <div className="mt-8 p-6 bg-[#f2f4f6] rounded-2xl flex items-center gap-6">
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0">
          <HelpCircle className="w-6 h-6 text-[#0F172A]" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[#191c1e]">
            ต้องการความช่วยเหลือ?
          </h4>
          <p className="text-sm text-[#45464d]">
            หากคุณมีปัญหาในการ{mode === "create" ? "เพิ่ม" : "แก้ไข"}
            {entityName} โปรดติดต่อแผนกไอที หรืออ่าน{" "}
            <a
              href="#"
              className="text-[#0F172A] underline decoration-[#0F172A]/30 underline-offset-4"
            >
              คู่มือการใช้งาน
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
