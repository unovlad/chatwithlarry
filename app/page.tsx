import { HomePageClient } from "@/components/HomePageClient";

const SUGGESTED_QUESTIONS = [
  "I'm nervous about turbulence",
  "Help me with breathing exercises",
  "What should I expect during takeoff?",
  "How can I stay calm during the flight?",
  "What if the plane has technical problems?",
  "I'm scared of heights and flying",
  "How safe are commercial flights?",
  "I always panic during the flight",
  "Can you help me with meditation techniques?",
  "Loud noises during flight",
  "How do I distract myself during a long flight?",
  "What if I feel claustrophobic on the plane?",
];

function getRandomQuestions(questions: string[], count: number): string[] {
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export default function Home() {
  const randomQuestions = getRandomQuestions(SUGGESTED_QUESTIONS, 3);

  return <HomePageClient randomQuestions={randomQuestions} />;
}
