import { getLang } from "@/lib/lang";
import { AlertsForm } from "./AlertsForm";

export default function AlertsPage() {
  const lang = getLang();
  return <AlertsForm lang={lang} />;
}
