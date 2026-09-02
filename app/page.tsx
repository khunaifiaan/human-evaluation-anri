import EvaluationApp from "@/components/evaluation-app";
import { evaluationItems } from "@/data/generated/items-public";

export default function Home() {
  return <EvaluationApp items={evaluationItems} />;
}
