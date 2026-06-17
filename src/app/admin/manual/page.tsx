import {
  activityStatusItems,
  announcementExample,
  assistantExamples,
  faqItems,
  manualSections,
  memberButtonItems,
} from "@/content/adminManual";
import { BookOpen, CheckCircle2, ClipboardList, HelpCircle } from "lucide-react";

function SectionCard({
  id,
  title,
  intro,
  steps,
  bullets,
  children,
}: {
  id: string;
  title: string;
  intro?: string;
  steps?: string[];
  bullets?: string[];
  children?: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-xl border border-gray-200 bg-white p-4"
    >
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      {intro ? <p className="mt-2 text-sm leading-6 text-gray-600">{intro}</p> : null}

      {steps ? (
        <ol className="mt-3 space-y-2">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-2 text-sm leading-6 text-gray-600">
              <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      ) : null}

      {bullets ? (
        <ul className="mt-3 space-y-2">
          {bullets.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-6 text-gray-600">
              <CheckCircle2 className="mt-1 h-4 w-4 flex-none text-blue-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {children}
    </section>
  );
}

function DefinitionGrid({
  items,
}: {
  items: readonly (readonly [string, string])[];
}) {
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {items.map(([term, description]) => (
        <div key={term} className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-sm font-semibold text-gray-900">{term}</p>
          <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
        </div>
      ))}
    </div>
  );
}

export default function AdminManualPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-0.5 h-5 w-5 flex-none text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-blue-950">管理员使用手册</h1>
            <p className="mt-1 text-sm leading-6 text-blue-800">
              这份手册只说明当前管理员如何使用网站，适合日常维护野球活动、赛事、资料和公告。
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">目录</h2>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {manualSections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700"
            >
              {section.title}
            </a>
          ))}
        </div>
      </section>

      {manualSections.map((section) => {
        if (section.id === "pickup") {
          return (
            <SectionCard key={section.id} {...section}>
              <div className="mt-4 border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-900">活动状态</h3>
                <DefinitionGrid items={activityStatusItems} />
              </div>
              <div className="mt-4 border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-900">成员按钮含义</h3>
                <DefinitionGrid items={memberButtonItems} />
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  如果成员改主意了，再次点击已选状态可以取消记录。
                </p>
              </div>
            </SectionCard>
          );
        }

        if (section.id === "announcement") {
          return (
            <SectionCard key={section.id} {...section}>
              <div className="mt-4 rounded-lg bg-gray-950 p-3">
                <pre className="whitespace-pre-wrap text-xs leading-6 text-gray-100">
                  {announcementExample}
                </pre>
              </div>
            </SectionCard>
          );
        }

        if (section.id === "assistant") {
          return (
            <SectionCard key={section.id} {...section}>
              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">示例输入</h3>
                {assistantExamples.map((example) => (
                  <div
                    key={example}
                    className="rounded-lg bg-gray-50 px-3 py-2 text-sm leading-6 text-gray-600"
                  >
                    {example}
                  </div>
                ))}
              </div>
            </SectionCard>
          );
        }

        if (section.id === "faq") {
          return (
            <SectionCard key={section.id} {...section}>
              <div className="mt-3 space-y-3">
                {faqItems.map((item) => (
                  <div key={item.question} className="rounded-lg bg-gray-50 p-3">
                    <div className="flex items-start gap-2">
                      <HelpCircle className="mt-0.5 h-4 w-4 flex-none text-blue-600" />
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          Q：{item.question}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-gray-600">
                          A：{item.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          );
        }

        return <SectionCard key={section.id} {...section} />;
      })}
    </div>
  );
}
