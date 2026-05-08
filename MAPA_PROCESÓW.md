# Uni Estates Tracker — Mapa procesów

## Jak czytać ten dokument
Każdy proces opisany jest w trzech częściach:
1. **Kto** — kto uczestniczy w procesie
2. **Diagram** — wizualny przepływ kroków
3. **Opis kroków** — co dokładnie dzieje się w każdym kroku

---

## PROCES 1 — Logowanie do aplikacji

**Kto:** każdy użytkownik (agent, manager, superadmin)

```mermaid
flowchart TD
    A([Otwierasz aplikację]) --> B[Ekran z klawiaturą PIN]
    B --> C[Wpisujesz 4-cyfrowy PIN]
    C --> D{PIN poprawny?}
    D -- NIE --> E[Animacja błędu\nPole się czyści]
    E --> B
    D -- TAK --> F{Jaka rola?}
    F -- Agent --> G[Widok AGENTA\nZakładka: Moje przychody]
    F -- Manager --> H[Widok MANAGERA\nZakładka: Przychody]
    F -- Superadmin --> I[Widok SUPERADMINA\nZakładka: Przychody]
```

**PINy:**
| Kto | PIN | Co widzi po zalogowaniu |
|-----|-----|------------------------|
| Piotr Chrobak (Superadmin) | `1234` | Wszystkie oddziały |
| Zbigniew Michalak (Superadmin) | `2234` | Wszystkie oddziały |
| Katarzyna Trybala (Manager Katowice) | `3234` | Tylko Katowice |
| Hanna (Agent Warszawa) | `1001` | Tylko swoje dane |
| Michał (Agent Warszawa) | `1002` | Tylko swoje dane |
| Nikolay (Agent Warszawa) | `1003` | Tylko swoje dane |
| Grzegorz (Agent Warszawa) | `1004` | Tylko swoje dane |
| Piotr Z. (Agent Warszawa) | `1005` | Tylko swoje dane |
| Mikołaj (Agent Warszawa) | `1006` | Tylko swoje dane |

---

## PROCES 2 — Agent wpisuje swoje działania (codziennie)

**Kto:** agent  
**Kiedy:** codziennie lub raz w tygodniu  
**Gdzie:** zakładka **Wpis**

```mermaid
flowchart TD
    A([Agent loguje się]) --> B[Zakładka: Wpis]
    B --> C[Wpisuje:\n• Telefony wychodzące\n• Umówione spotkania\n• Spotkania które się odbyły\n• Pozyski]
    C --> D[Klika: Zapisz działania]
    D --> E{Zapis OK?}
    E -- TAK --> F[Zielone powiadomienie\nPola się czyszczą]
    E -- BŁĄD --> G[Czerwone powiadomienie\nDane zostają w polach]
    F --> H([Wpis zapisany w systemie])
```

**Co dzieje się z danymi po zapisie:**
- Wpis trafia do bazy danych przypisany do **bieżącego tygodnia** i **bieżącego kwartału**
- Dane natychmiast widoczne w zakładkach: **Moje wyniki**, **Ranking**, **Aktywność** (u managera)
- Jeśli agent wpisuje kilka razy w tygodniu — sumowane są wszystkie wpisy

---

## PROCES 3 — Agent sprawdza swoje wyniki

**Kto:** agent  
**Gdzie:** zakładki **Moje przychody** i **Wyniki**

```mermaid
flowchart LR
    A([Agent loguje się]) --> B{Którą zakładkę\notwiera?}

    B -- Moje przychody --> C[Widzi:\n• Prowizję kwartalną\n• % realizacji celu\n• Miejsce w rankingu\n• Progi bonusowe]

    B -- Wyniki --> D[Widzi:\n• Telefony tego tygodnia\n• Spotkania\n• Pozyski\n• Konwersję spotkania/telefony\n• Wykres 6 tygodni wstecz]

    C --> E[Zmienia kwartał\nby zobaczyć historię]
    D --> F[Widzi trend\nvs poprzedni tydzień]
```

**Skąd biorą się dane o przychodach:**
- Na razie: dane wpisywane ręcznie przez managera
- Docelowo: automatycznie z arkusza Google Sheets agenta (`Plik Prowizje-Bonusy`)

**Progi bonusowe** — pokazują 3 poziomy prowizji:
- Próg 1: niższy procent prowizji (np. 3%)
- Próg 2: wyższy procent (np. 5%)
- Próg 3: najwyższy procent (np. 7%)
- Docelowo: wartości z arkusza **WARUNKI BONUSÓW**

---

## PROCES 4 — Agent obsługuje zapytania

**Kto:** agent  
**Gdzie:** zakładka **Zapytania**  
**Źródło danych:** arkusz Google Sheets agenta (zakładka `Zapytania`)

```mermaid
flowchart TD
    A([Agent otwiera\nzakładkę Zapytania]) --> B[Pobiera listę zapytań\nz arkusza Sheets]
    B --> C{Arkusz\nskonfigurowany?}
    C -- NIE --> D[Komunikat:\nArkusz nie skonfigurowany]
    C -- TAK --> E[Lista zapytań:\nnazwa klienta, tel/email,\nnumer oferty, data]
    E --> F[Agent wybiera zapytanie]
    F --> G[Zmienia status:]
    G --> G1[Skontaktowano się]
    G --> G2[Działamy]
    G --> G3[Brak kontaktu]
    G --> G4[Niezainteresowany]
    G1 & G2 & G3 & G4 --> H[Status zapisany\nnatychmiastowo]
    H --> I([Widoczne w\nwidoku managera])
```

**Ważne zasady:**
- Dane klientów (imię, telefon, e-mail) przechowywane są **wyłącznie w arkuszu Sheets**
- W bazie danych zapisywany jest tylko **status** (co zrobiono z zapytaniem)
- Agent może odświeżyć listę pociągając ekran w dół (pull-to-refresh)

---

## PROCES 5 — Agent obsługuje leady

**Kto:** agent  
**Gdzie:** zakładka **Leady**  
**Źródło danych:** arkusz Google Sheets agenta (zakładka `Leady`)

```mermaid
flowchart TD
    A([Agent otwiera\nzakładkę Leady]) --> B[Lista leadów\nz podsumowaniem pipeline'u]
    B --> C[Agent wybiera lead]
    C --> D[Zmienia status:]
    D --> D1[Skontaktowano się]
    D --> D2[Działamy]
    D --> D3[Brak kontaktu]
    D --> D4[Spotkanie umówione]
    D --> D5[Podpisano umowę]
    D --> D6[Niezainteresowany]
    D1 & D2 & D3 & D4 & D5 & D6 --> E[Status zapisany]
```

**Pipeline u góry ekranu** pokazuje ile leadów jest na każdym etapie — agent ma natychmiastowy przegląd swojego lejka sprzedażowego.

---

## PROCES 6 — Manager przegląda przychody oddziału

**Kto:** manager  
**Gdzie:** zakładka **Przychody**

```mermaid
flowchart TD
    A([Manager loguje się]) --> B[Zakładka: Przychody]
    B --> C[Wybiera kwartał\nnp. Q2 2026]
    C --> D[Widzi:\n• Pasek do celu zespołu\n• Łączne przychody\n• Ranking agentów\n• Wykres prowizji]
    D --> E{Co chce sprawdzić?}
    E -- Kto jest liderem --> F[Tabela posortowana\npo prowizji]
    E -- Jak każdy radzi\n sobie z celem --> G[% celu ind.\nprzy każdym agencie]
    E -- Poprzednie kwartały --> H[Zmienia kwartał\nw selektorze]
```

**Statusy agentów w tabeli:**
- **Cel!** (zielony) — prowizja ≥ 100% celu indywidualnego
- **Na kursie** (niebieski) — 70–99% celu
- **W toku** (złoty) — 40–69% celu
- **Niski** (czerwony) — poniżej 40% celu

---

## PROCES 7 — Manager ocenia agentów

**Kto:** manager  
**Gdzie:** zakładka **Oceny**  
**Kiedy:** raz w tygodniu (np. w piątek lub poniedziałek)

```mermaid
flowchart TD
    A([Manager otwiera\nzakładkę Oceny]) --> B[Wybiera tydzień\nbieżący / poprzedni / 2 tygodnie temu]
    B --> C[Widzi kartę\ndla każdego agenta]
    C --> D[Dla każdego agenta:]
    D --> D1[Ocena punktowa\n0–8 punktów]
    D --> D2[Badge:\nWybitny / Dobry /\nSredni / Do poprawy]
    D --> D3[Automatyczny komentarz\nnp. Michał osiągnął\ndobre wyniki...]
    D --> D4[4 metryki szczegółowe]
    D --> D5[Mini wykres\nhistorii telefonów]
```

**Jak system wylicza ocenę:**
```
Telefony ≥ 50/tydzień       → +2 pkt
Telefony ≥ 25/tydzień       → +1 pkt
Pozyski ≥ 3 w tygodniu      → +3 pkt
Pozyski ≥ 1 w tygodniu      → +2 pkt
Konwersja ≥ 5%              → +2 pkt   (spotkania ÷ telefony)
Konwersja ≥ 2%              → +1 pkt
Wzrost telefonów > 10% r/r  → +1 pkt
─────────────────────────────────────
Maksymalnie                    8 pkt
```

---

## PROCES 8 — Manager wpisuje aktywność za agenta

**Kto:** manager lub superadmin  
**Gdzie:** zakładka **Wpis**  
**Kiedy:** gdy agent sam nie wpisał lub potrzeba korekty

```mermaid
flowchart TD
    A([Manager otwiera\nzakładkę Wpis]) --> B[Wybiera agenta\nz listy dropdown]
    B --> C[Wpisuje wartości\ndla wybranego agenta]
    C --> D[Klika: Zapisz]
    D --> E([Wpis przypisany\ndo wybranego agenta])

    A --> F{Potrzeba\nresetować tydzień?}
    F -- TAK --> G[Przycisk: Resetuj\nbieżący tydzień]
    G --> H[Potwierdzenie\nANULUJ / POTWIERDŹ]
    H -- POTWIERDŹ --> I([Usunięte wszystkie\nwpisy tego tygodnia])
```

---

## PROCES 9 — Manager przegląda zapytania i leady zespołu

**Kto:** manager lub superadmin  
**Gdzie:** zakładki **Zapytania** i **Leady**

```mermaid
flowchart TD
    A([Manager otwiera\nzakładkę Zapytania lub Leady]) --> B[Ładuje dane\nze wszystkich agentów]
    B --> C[Filtruje po:\n• Agencie\n• Statusie\n• Typie zapytania]
    C --> D[Widzi pełną listę\nz oznaczeniem agenta]
    D --> E[Może zmienić\nstatus dowolnego wiersza]
    E --> F([Zmiana zapisana\nw bazie danych])
```

---

## PROCES 10 — Superadmin przegląda wszystkie oddziały

**Kto:** superadmin (Piotr Chrobak lub Zbigniew Michalak)  
**Gdzie:** zakładka **Przychody**

```mermaid
flowchart TD
    A([Superadmin loguje się]) --> B[Zakładka: Przychody]
    B --> C[Dwa selektory:\n• Kwartał\n• Oddział]
    C --> D{Wybór oddziału}
    D -- Wszystkie --> E[Widzi agentów\nze wszystkich oddziałów]
    D -- Warszawa --> F[Tylko agenci Warszawy]
    D -- Kraków --> G[Tylko agenci Krakowa]
    D -- Katowice --> H[Tylko agenci Katowic]
    E & F & G & H --> I[Tabela z oddziałem\nprzy każdym agencie]
```

---

## PROCES 11 — Synchronizacja danych z Google Sheets

**Kto:** automatyczny (przy starcie serwera) lub ręcznie przez superadmina  
**Kiedy:** przy każdym uruchomieniu serwera

```mermaid
flowchart TD
    A([Serwer się uruchamia]) --> B{API Key\nustawiony?}
    B -- NIE --> C[Dane agentów\nz pliku konfiguracyjnego\nstatyczny fallback]
    B -- TAK --> D[Łączy się z arkuszem\nWARUNKI BONUSÓW]
    D --> E[Dla każdego aktywnego agenta\npobiera:\n• ID arkusza leadów\n• ID arkusza prowizji\n• Progi bonusowe]
    E --> F[Aktualizuje mapę\narkuszy agentów w pamięci]
    F --> G([System gotowy\ndo pobierania danych na żywo])
```

**Skąd biorą się dane w poszczególnych zakładkach:**

| Zakładka | Źródło danych | Cache |
|----------|---------------|-------|
| Przychody (manager/superadmin) | Baza danych SQLite | — |
| Moje przychody (agent) | Baza danych SQLite (docelowo: Sheets) | — |
| Aktywność | Baza danych SQLite | — |
| Oceny | Baza danych SQLite | — |
| Wpis | → zapisuje do bazy SQLite | — |
| Moje zapytania | Google Sheets agenta + statusy z DB | 5 min |
| Moje leady | Google Sheets agenta + statusy z DB | 5 min |
| Zapytania (manager) | Google Sheets wszystkich agentów + DB | 5 min |
| Leady (manager) | Google Sheets wszystkich agentów + DB | 5 min |

---

## MAPA UPRAWNIEŃ — co kto może

```mermaid
flowchart LR
    subgraph SUPERADMIN["👑 SUPERADMIN (Piotr, Zbigniew)"]
        SA1[Przychody — wszystkie oddziały]
        SA2[Aktywność — wszystkie oddziały]
        SA3[Zapytania — wszystkich agentów]
        SA4[Leady — wszystkich agentów]
        SA5[Wpis — za każdego agenta]
    end

    subgraph MANAGER["🏢 MANAGER (Katarzyna)"]
        M1[Przychody — swój oddział]
        M2[Aktywność — swój oddział]
        M3[Oceny — swój oddział]
        M4[Zapytania — swój oddział]
        M5[Leady — swój oddział]
        M6[Wpis — za agentów oddziału]
    end

    subgraph AGENT["👤 AGENT (Hanna, Michał, ...)]"]
        AG1[Moje przychody — tylko swoje]
        AG2[Moje wyniki — tylko swoje]
        AG3[Ranking — widzi cały team]
        AG4[Zapytania — tylko swoje]
        AG5[Leady — tylko swoje]
        AG6[Wpis — tylko siebie]
    end
```

---

## HARMONOGRAM TYPOWEGO TYGODNIA

```mermaid
gantt
    title Tydzień pracy z aplikacją
    dateFormat  D
    axisFormat  %A

    section Agent (codziennie)
    Wpis działań dziennych        :active, 1, 5d

    section Agent (piątek)
    Sprawdzenie rankingu          :4, 1d
    Przegląd zapytań i leadów     :4, 1d

    section Manager (poniedziałek)
    Przegląd aktywności zespołu   :1, 1d
    Oceny agentów za miniony tydz.:1, 1d

    section Manager (w ciągu tygodnia)
    Przeglądanie leadów i zapytań :1, 5d
    Wpis za agentów jeśli brakuje :2, 3d

    section Manager (koniec kwartału)
    Aktualizacja przychodów       :5, 1d
```

---

*Dokument przeznaczony dla właścicieli procesów biznesowych. Wersja: 2026-04-29*
