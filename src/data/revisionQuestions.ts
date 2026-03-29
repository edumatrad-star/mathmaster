export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export const revisionQuestions: Record<number, Question[]> = {
  1: [
    // EASY (7 tasks)
    {
      id: 101,
      text: "Ile wynosi $\\frac{1}{2} + \\frac{1}{2}$?",
      options: ["$\\frac{1}{4}$", "1", "$\\frac{2}{4}$", "0.5"],
      correctAnswer: 1,
      explanation: "Połowa plus połowa to jedna całość.",
      difficulty: 'easy'
    },
    {
      id: 102,
      text: "Oblicz: $0.5 + 0.5$",
      options: ["0.10", "1.0", "0.55", "5.5"],
      correctAnswer: 1,
      explanation: "Pięć dziesiątych i pięć dziesiątych daje jedną całą.",
      difficulty: 'easy'
    },
    {
      id: 103,
      text: "Ile to jest $\\frac{1}{4} + \\frac{3}{4}$?",
      options: ["$\\frac{4}{8}$", "1", "0.5", "1.25"],
      correctAnswer: 1,
      explanation: "Jedna czwarta i trzy czwarte to cztery czwarte, czyli 1.",
      difficulty: 'easy'
    },
    {
      id: 104,
      text: "Wynik mnożenia $2 \\cdot 0.5$ to:",
      options: ["1", "2.5", "0.10", "1.5"],
      correctAnswer: 0,
      explanation: "Dwa razy połowa to jeden.",
      difficulty: 'easy'
    },
    {
      id: 105,
      text: "Ile wynosi $10 : 2$?",
      options: ["2", "5", "20", "8"],
      correctAnswer: 1,
      explanation: "Dziesięć podzielone na dwa to pięć.",
      difficulty: 'easy'
    },
    {
      id: 106,
      text: "Oblicz: $0.2 + 0.8$",
      options: ["0.10", "1", "0.16", "1.2"],
      correctAnswer: 1,
      explanation: "Dwie dziesiąte i osiem dziesiątych to dziesięć dziesiątych, czyli 1.",
      difficulty: 'easy'
    },
    {
      id: 107,
      text: "Ile to jest $1 - 0.5$?",
      options: ["0.5", "1.5", "0", "0.1"],
      correctAnswer: 0,
      explanation: "Od całości odejmujemy połowę, zostaje połowa.",
      difficulty: 'easy'
    },
    // MEDIUM (7 tasks)
    {
      id: 108,
      text: "Ile wynosi $\\frac{1}{2} \\cdot \\frac{1}{4}$?",
      options: ["$\\frac{1}{8}$", "$\\frac{2}{6}$", "$\\frac{1}{6}$", "$\\frac{1}{2}$"],
      correctAnswer: 0,
      explanation: "Mnożymy licznik przez licznik i mianownik przez mianownik: $\\frac{1\\cdot1}{2\\cdot4} = \\frac{1}{8}$.",
      difficulty: 'medium'
    },
    {
      id: 109,
      text: "Oblicz: $0.75 - 0.25$",
      options: ["0.5", "0.55", "1", "0.25"],
      correctAnswer: 0,
      explanation: "Siedemdziesiąt pięć setnych minus dwadzieścia pięć setnych to pięćdziesiąt setnych, czyli 0.5.",
      difficulty: 'medium'
    },
    {
      id: 110,
      text: "Ile to jest $\\frac{2}{3} + \\frac{1}{6}$?",
      options: ["$\\frac{3}{9}$", "$\\frac{5}{6}$", "$\\frac{1}{2}$", "1"],
      correctAnswer: 1,
      explanation: "Sprowadzamy do wspólnego mianownika: $\\frac{4}{6} + \\frac{1}{6} = \\frac{5}{6}$.",
      difficulty: 'medium'
    },
    {
      id: 111,
      text: "Wynik $1.2 \\cdot 2$ to:",
      options: ["2.2", "2.4", "1.4", "3.2"],
      correctAnswer: 1,
      explanation: "Dwa razy jeden i dwie dziesiąte to dwa i cztery dziesiąte.",
      difficulty: 'medium'
    },
    {
      id: 112,
      text: "Ile wynosi $5 : 0.5$?",
      options: ["2.5", "10", "1", "5.5"],
      correctAnswer: 1,
      explanation: "Dzielenie przez 0.5 to to samo co mnożenie przez 2.",
      difficulty: 'medium'
    },
    {
      id: 113,
      text: "Oblicz: $\\frac{3}{4} - \\frac{1}{2}$?",
      options: ["$\\frac{2}{2}$", "$\\frac{1}{4}$", "$\\frac{1}{2}$", "$\\frac{1}{8}$"],
      correctAnswer: 1,
      explanation: "Sprowadzamy do wspólnego mianownika: $\\frac{3}{4} - \\frac{2}{4} = \\frac{1}{4}$.",
      difficulty: 'medium'
    },
    {
      id: 114,
      text: "Ile to jest $0.1 \\cdot 100$?",
      options: ["1", "10", "100", "0.100"],
      correctAnswer: 1,
      explanation: "Przesuwamy przecinek o dwa miejsca w prawo.",
      difficulty: 'medium'
    },
    // HARD (7 tasks)
    {
      id: 115,
      text: "Oblicz: $(\\frac{1}{2} + \\frac{1}{3}) \\cdot 6$",
      options: ["5", "3", "2", "6"],
      correctAnswer: 0,
      explanation: "$\\frac{1}{2} + \\frac{1}{3} = \\frac{3}{6} + \\frac{2}{6} = \\frac{5}{6}$. Następnie $\\frac{5}{6} \\cdot 6 = 5$.",
      difficulty: 'hard'
    },
    {
      id: 116,
      text: "Ile wynosi $0.125 \\cdot 8$?",
      options: ["0.1", "1", "1.25", "0.8"],
      correctAnswer: 1,
      explanation: "Osiem razy jedna ósma to jeden.",
      difficulty: 'hard'
    },
    {
      id: 117,
      text: "Wynik dzielenia $\\frac{1}{2} : \\frac{1}{4}$ to:",
      options: ["$\\frac{1}{8}$", "2", "$\\frac{1}{2}$", "4"],
      correctAnswer: 1,
      explanation: "Mnożymy przez odwrotność: $\\frac{1}{2} \\cdot \\frac{4}{1} = 2$.",
      difficulty: 'hard'
    },
    {
      id: 118,
      text: "Oblicz: $2.5 \\cdot 0.4 + 1$",
      options: ["2", "3", "1.5", "2.4"],
      correctAnswer: 0,
      explanation: "$2.5 \\cdot 0.4 = 1$. Następnie $1 + 1 = 2$.",
      difficulty: 'hard'
    },
    {
      id: 119,
      text: "Ile to jest $\\frac{3}{5}$ z liczby 25?",
      options: ["10", "15", "20", "5"],
      correctAnswer: 1,
      explanation: "$25 : 5 = 5$, a $5 \\cdot 3 = 15$.",
      difficulty: 'hard'
    },
    {
      id: 120,
      text: "Wartość wyrażenia $0.33... + 0.66...$ (ułamki okresowe) wynosi:",
      options: ["0.99", "1", "0.9", "1.1"],
      correctAnswer: 1,
      explanation: "$\\frac{1}{3} + \\frac{2}{3} = 1$.",
      difficulty: 'hard'
    },
    {
      id: 121,
      text: "Ile wynosi $\\sqrt{0.25} + 0.5$?",
      options: ["0.75", "1", "0.5", "1.25"],
      correctAnswer: 1,
      explanation: "$\\sqrt{0.25} = 0.5$. Następnie $0.5 + 0.5 = 1$.",
      difficulty: 'hard'
    }
  ],
  2: [
    {
      id: 201,
      text: "Cena butów wynosiła 200 zł. Po obniżce o 15% nowa cena to:",
      options: ["170 zł", "185 zł", "175 zł", "160 zł"],
      correctAnswer: 0,
      explanation: "15% z 200 zł to $0.15 \\cdot 200 = 30$ zł. Nowa cena: $200 - 30 = 170$ zł.",
      difficulty: 'easy'
    },
    {
      id: 202,
      text: "Liczba 40 stanowi jaki procent liczby 160?",
      options: ["20%", "25%", "30%", "40%"],
      correctAnswer: 1,
      explanation: "$(40 / 160) \\cdot 100\\% = \\frac{1}{4} \\cdot 100\\% = 25\\%$.",
      difficulty: 'medium'
    },
    {
      id: 203,
      text: "Jeśli cena wzrosła o 20%, a potem spadła o 20%, to cena końcowa względem początkowej:",
      options: ["Jest taka sama", "Wzrosła o 4%", "Spadła o 4%", "Spadła o 2%"],
      correctAnswer: 2,
      explanation: "Załóżmy cenę 100. Po wzroście: $100 \\cdot 1.2 = 120$. Po spadku: $120 \\cdot 0.8 = 96$. Spadek o 4%.",
      difficulty: 'hard'
    }
  ],
  3: [
    {
      id: 301,
      text: "Rozwiązaniem równania $3x - 5 = 7$ jest:",
      options: ["x = 2", "x = 4", "x = 6", "x = 12"],
      correctAnswer: 1,
      explanation: "$3x = 7 + 5 \\Rightarrow 3x = 12 \\Rightarrow x = 4$.",
      difficulty: 'easy'
    },
    {
      id: 302,
      text: "Wartość wyrażenia $2(a - 3) + 4$ dla $a = 5$ wynosi:",
      options: ["4", "8", "10", "12"],
      correctAnswer: 1,
      explanation: "$2(5 - 3) + 4 = 2(2) + 4 = 4 + 4 = 8$.",
      difficulty: 'medium'
    }
  ],
  4: [
    {
      id: 401,
      text: "Samochód jedzie z prędkością 60 km/h. Jaką drogę pokona w ciągu 2,5 godziny?",
      options: ["120 km", "150 km", "180 km", "140 km"],
      correctAnswer: 1,
      explanation: "Droga $s = v \\cdot t = 60 \\text{ km/h} \\cdot 2.5 \\text{ h} = 150 \\text{ km}$.",
      difficulty: 'easy'
    },
    {
      id: 402,
      text: "Jeśli 3 kg jabłek kosztują 12 zł, to ile kosztuje 5 kg tych samych jabłek?",
      options: ["15 zł", "18 zł", "20 zł", "24 zł"],
      correctAnswer: 2,
      explanation: "Cena za 1 kg: $12 / 3 = 4$ zł. Cena za 5 kg: $5 \\cdot 4 = 20$ zł.",
      difficulty: 'medium'
    }
  ]
};
