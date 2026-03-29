export interface Topic {
  id: string;
  name: string;
}

export interface WeekPlan {
  week: number;
  title: string;
  topics: Topic[];
  description: string;
  status: "completed" | "in-progress" | "not-started";
  lessonId?: string;
}

export const studyPlan: WeekPlan[] = [
  {
    week: 1,
    title: "Liczby i działania",
    topics: [
      { id: 'w1t1', name: "Ułamki zwykłe i dziesiętne" },
      { id: 'w1t2', name: "Potęgi o wykładniku naturalnym" },
      { id: 'w1t3', name: "Pierwiastki kwadratowe i sześcienne" }
    ],
    description: "Fundament matematyki. Skup się na kolejności wykonywania działań i szacowaniu wyników.",
    status: "completed",
    lessonId: "fractions-basics"
  },
  {
    week: 2,
    title: "Procenty",
    topics: [
      { id: 'w2t1', name: "Obliczanie procentu danej liczby" },
      { id: 'w2t2', name: "Podwyżki i obniżki" },
      { id: 'w2t3', name: "Punkty procentowe" }
    ],
    description: "Kluczowy temat na egzaminie. Pamiętaj o zamianie procentu na ułamek.",
    status: "in-progress",
    lessonId: "percentages-mastery"
  },
  {
    week: 3,
    title: "Wyrażenia algebraiczne i równania",
    topics: [
      { id: 'w3t1', name: "Przekształcanie wzorów" },
      { id: 'w3t2', name: "Rozwiązywanie równań z jedną niewiadomą" },
      { id: 'w3t3', name: "Zadania tekstowe z równaniami" }
    ],
    description: "Naucz się 'tłumaczyć' treść zadania na język matematyki.",
    status: "not-started",
    lessonId: "equations-intro"
  },
  {
    week: 4,
    title: "Proporcjonalność i zadania tekstowe",
    topics: [
      { id: 'w4t1', name: "Proporcjonalność prosta" },
      { id: 'w4t2', name: "Prędkość, droga, czas" },
      { id: 'w4t3', name: "Zadania o stężeniach" }
    ],
    description: "Skup się na jednostkach i logicznym sprawdzaniu wyników.",
    status: "not-started",
    lessonId: "proportionality-word-problems"
  },
  {
    week: 5,
    title: "Geometria płaska I",
    topics: [
      { id: 'w5t1', name: "Kąty wierzchołkowe i przyległe" },
      { id: 'w5t2', name: "Własności trójkątów" },
      { id: 'w5t3', name: "Twierdzenie Pitagorasa" }
    ],
    description: "Rysunek pomocniczy to podstawa sukcesu w geometrii.",
    status: "not-started",
    lessonId: "geometry-basics"
  },
  {
    week: 6,
    title: "Geometria płaska II",
    topics: [
      { id: 'w6t1', name: "Czworokąty i ich własności" },
      { id: 'w6t2', name: "Pola i obwody figur" },
      { id: 'w6t3', name: "Koła i okręgi" }
    ],
    description: "Zapamiętaj wzory na pola, ale naucz się też je wyprowadzać.",
    status: "not-started",
    lessonId: "polygons-circles"
  },
  {
    week: 7,
    title: "Układ współrzędnych i symetria",
    topics: [
      { id: 'w7t1', name: "Odległość punktów w układzie" },
      { id: 'w7t2', name: "Symetria osiowa i środkowa" },
      { id: 'w7t3', name: "Przesunięcia" }
    ],
    description: "Precyzja w rysowaniu i odczytywaniu współrzędnych.",
    status: "not-started",
    lessonId: "coordinate-system"
  },
  {
    week: 8,
    title: "Stereometria I - Graniastosłupy",
    topics: [
      { id: 'w8t1', name: "Rodzaje graniastosłupów" },
      { id: 'w8t2', name: "Pola powierzchni" },
      { id: 'w8t3', name: "Objętość" }
    ],
    description: "Wyobraźnia przestrzenna. Pamiętaj o siatkach brył.",
    status: "not-started",
    lessonId: "prisms-3d"
  },
  {
    week: 9,
    title: "Stereometria II - Ostrosłupy",
    topics: [
      { id: 'w9t1', name: "Własności ostrosłupów" },
      { id: 'w9t2', name: "Wysokość ściany bocznej" },
      { id: 'w9t3', name: "Zadania optymalizacyjne" }
    ],
    description: "Zwróć uwagę na relacje między krawędziami a wysokością.",
    status: "not-started",
    lessonId: "pyramids-3d"
  },
  {
    week: 10,
    title: "Statystyka i Prawdopodobieństwo",
    topics: [
      { id: 'w10t1', name: "Średnia arytmetyczna" },
      { id: 'w10t2', name: "Mediana i moda" },
      { id: 'w10t3', name: "Prawdopodobieństwo zdarzeń" }
    ],
    description: "Temat często niedoceniany, a dający łatwe punkty.",
    status: "not-started",
    lessonId: "statistics-probability"
  },
  {
    week: 11,
    title: "Strategie zadań otwartych",
    topics: [
      { id: 'w11t1', name: "Dowodzenie w geometrii" },
      { id: 'w11t2', name: "Uzasadnianie własności liczb" },
      { id: 'w11t3', name: "Zapisywanie toku rozumowania" }
    ],
    description: "Egzaminator ocenia sposób myślenia, nie tylko wynik.",
    status: "not-started",
    lessonId: "open-tasks-strategies"
  },
  {
    week: 12,
    title: "Powtórka generalna",
    topics: [
      { id: 'w12t1', name: "Arkusze z lat ubiegłych" },
      { id: 'w12t2', name: "Zarządzanie czasem na egzaminie" },
      { id: 'w12t3', name: "Eliminacja typowych błędów" }
    ],
    description: "Ostatnia prosta. Skup się na pewności siebie i spokoju.",
    status: "not-started",
    lessonId: "final-revision"
  }
];

export const getWeekTitle = (week: number) => {
  return studyPlan.find(p => p.week === week)?.title || `Tydzień ${week}`;
};
