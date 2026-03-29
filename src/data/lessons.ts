export interface Lesson {
  id: string;
  week: number;
  topic: string;
  scope: string[];
  content: string;
  videoUrl?: string;
}

export const lessons: Lesson[] = [
  {
    id: 'w1-natural-numbers',
    week: 1,
    topic: 'Liczby naturalne i system dziesiątkowy',
    scope: [
      'Zapisywanie i odczytywanie liczb w systemie dziesiątkowym',
      'Porównywanie liczb naturalnych',
      'Zaokrąglanie liczb naturalnych',
      'Liczby rzymskie (podstawy)'
    ],
    content: `
# Liczby Naturalne

Liczby naturalne to te, których używamy do liczenia przedmiotów: $0, 1, 2, 3, 4, \\dots$

### System dziesiątkowy
Nasz system jest **pozycyjny**, co oznacza, że wartość cyfry zależy od jej miejsca w liczbie.
Przykład: W liczbie $532$:
- $5$ to setki ($500$)
- $3$ to dziesiątki ($30$)
- $2$ to jedności ($2$)

### Zaokrąglanie
- Jeśli cyfra po prawej to $0, 1, 2, 3, 4$ - zaokrąglamy **w dół**.
- Jeśli cyfra po prawej to $5, 6, 7, 8, 9$ - zaokrąglamy **w górę**.
    `
  },
  {
    id: 'w2-fractions-intro',
    week: 2,
    topic: 'Wprowadzenie do ułamków zwykłych',
    scope: [
      'Pojęcie ułamka jako części całości',
      'Licznik, mianownik i kreska ułamkowa',
      'Ułamki właściwe i niewłaściwe',
      'Liczby mieszane'
    ],
    content: `
# Ułamki Zwykłe

Ułamek to część całości. Zapisujemy go jako $\\frac{a}{b}$.

- **Licznik ($a$)**: mówi nam, ile części mamy.
- **Mianownik ($b$)**: mówi nam, na ile równych części podzielono całość.

### Rodzaje ułamków:
1. **Właściwe**: Licznik jest mniejszy od mianownika (np. $\\frac{1}{2}$).
2. **Niewłaściwe**: Licznik jest większy lub równy mianownikowi (np. $\\frac{5}{4}$).
3. **Liczby mieszane**: Całość i ułamek (np. $1\\frac{1}{2}$).
    `
  },
  {
    id: 'w3-equations',
    week: 3,
    topic: 'Równania i wyrażenia algebraiczne',
    scope: [
      'Zapisywanie prostych wyrażeń algebraicznych',
      'Rozwiązywanie równań z jedną niewiadomą',
      'Przekształcanie prostych wzorów'
    ],
    content: `
# Równania

Równanie to waga, która musi być w równowadze. To, co zrobisz po lewej stronie, musisz zrobić też po prawej.

### Przykład:
$x + 5 = 12$
Odejmujemy $5$ od obu stron:
$x + 5 - 5 = 12 - 5$
$x = 7$

### Przekształcanie wzorów:
Jeśli mamy $v = \\frac{s}{t}$ i chcemy wyznaczyć $s$, mnożymy obie strony przez $t$:
$v \\cdot t = s$
    `
  }
];
