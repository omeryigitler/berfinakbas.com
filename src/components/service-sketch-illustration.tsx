import styles from "./service-sketch-illustration.module.css";

type ServiceSketchType = "adult" | "children" | "family" | "teen";

export function ServiceSketchIllustration({ type }: { type: ServiceSketchType }) {
  if (type === "children") {
    return (
      <svg className={styles.art} aria-hidden="true" viewBox="0 0 520 390">
        <g className="service-sketch-fill">
          <ellipse cx="146" cy="315" rx="104" ry="18" />
          <ellipse cx="358" cy="315" rx="103" ry="18" />
        </g>
        <g className="service-sketch-lines">
          <path d="M70 240c21-14 65-18 101-5 21 8 37 25 41 44-18 13-48 21-77 20-30-2-57-12-73-27 0-13 2-23 8-32Z" />
          <path d="M90 234v-23c0-11 8-18 20-18h51c12 0 20 7 20 18v24" />
          <path d="M106 194v-23h60v23M124 171v-23h37v23M138 148v-23h21v23" />
          <ellipse cx="149" cy="117" rx="24" ry="11" />
          <ellipse cx="147" cy="100" rx="30" ry="12" />
          <ellipse cx="145" cy="82" rx="35" ry="13" />
          <path d="M145 69V45M135 45h20" />
          <rect x="230" y="89" width="66" height="64" rx="5" />
          <rect x="284" y="118" width="66" height="64" rx="5" />
          <rect x="242" y="149" width="66" height="64" rx="5" />
          <path d="M249 124c15-19 31-19 44 0M304 153c14-20 28-20 40 0M259 184h36" />
          <path d="M252 104h20m-10-9v20M303 136h27M259 165h31" />
          <path d="M374 112c-23 3-38 21-38 45 0 18 7 33 19 43-17 11-25 29-21 49 4 20 22 32 43 31 18-1 33-10 42-23 12 12 31 18 49 12 19-7 30-25 27-45-2-15-11-28-23-35 7-14 5-31-5-43-11-14-29-20-46-15-8-13-26-21-47-19Z" />
          <circle cx="371" cy="146" r="19" />
          <circle cx="351" cy="127" r="9" />
          <circle cx="391" cy="127" r="9" />
          <circle cx="365" cy="144" r="2.5" />
          <circle cx="378" cy="144" r="2.5" />
          <path d="M365 154c4 4 9 4 13 0M353 199c16 12 39 12 55 0M364 215c-9 17-8 38 4 53M406 214c8 14 7 32-1 47" />
          <path d="M63 317l77-36 58 37-70 34-65-35Z" />
          <path d="M86 318l39-17 24 14-37 18-26-15ZM143 298l31 19" />
          <path d="M95 309c8-14 23-17 33-6 8 9 4 22-7 28M151 310c10-12 27-11 35 1" />
        </g>
      </svg>
    );
  }

  if (type === "teen") {
    return (
      <svg className={styles.art} aria-hidden="true" viewBox="0 0 520 390">
        <g className="service-sketch-fill">
          <ellipse cx="306" cy="319" rx="155" ry="19" />
        </g>
        <g className="service-sketch-lines">
          <g transform="rotate(-8 250 155)">
            <rect x="113" y="65" width="270" height="176" rx="18" />
            <rect x="127" y="80" width="242" height="143" rx="10" />
            <circle cx="248" cy="231" r="4" />
            <path d="M155 105h145M155 126h112M155 147h154M155 168h88" />
            <path d="M320 108l21 17-21 17" />
          </g>
          <path d="M316 156c57-18 117 10 135 63 15 46-3 97-42 122" />
          <path d="M325 174c43-12 88 10 102 50 11 33-2 70-30 88" />
          <path d="M296 242c-4-35 10-61 40-73M427 224c10 24 9 50-2 71" />
          <path d="M285 232c20-10 43 1 50 22l13 40c6 20-5 39-25 44-19 5-39-7-44-27l-11-41c-5-17 2-31 17-38Z" />
          <path d="M411 215c-20-6-40 6-45 27l-9 43c-4 20 9 38 29 42 20 4 38-9 42-29l8-42c4-18-6-35-25-41Z" />
          <path d="M300 249c8 16 12 35 13 58M402 236c-6 20-9 39-8 59" />
          <path d="M181 285c28-10 61-9 91 2M174 301c31-9 65-8 98 4" />
        </g>
      </svg>
    );
  }

  if (type === "adult") {
    return (
      <svg className={styles.art} aria-hidden="true" viewBox="0 0 520 390">
        <g className="service-sketch-fill">
          <ellipse cx="285" cy="327" rx="176" ry="18" />
        </g>
        <g className="service-sketch-lines">
          <path d="M105 83c44-12 89-15 133-7 8 2 13 8 13 16v184c0 8-7 14-15 12-45-9-88-7-131 6V83Z" />
          <path d="M251 92c42-11 86-9 132 7v193c-45-16-89-18-132-7V92Z" />
          <path d="M117 101c37-10 74-12 111-6M117 122c36-9 73-11 110-5M273 117c31-7 62-4 94 7M273 139c31-6 62-3 94 7" />
          <path d="M139 270c26-6 56-7 84-2M278 262c25-4 52-2 79 7" />
          <path d="M181 284l119-129 17 14-118 130-22 7 4-22Z" />
          <path d="M300 155l19 16M190 286l9 13" />
          <path d="M94 69c0-14 9-24 23-25l111-7c14-1 24 8 25 22l2 28c-45-10-94-8-149 6L94 69Z" />
          <path d="M347 197c35-7 70 12 80 44 10 34-9 69-43 78-34 9-68-11-77-45-8-30 7-60 40-77Z" />
          <path d="M424 233c25-7 48 7 53 30 5 24-12 45-36 47M329 240c19 5 43 4 73-3" />
          <path d="M349 219c9 8 13 19 13 31M382 214c12 11 16 26 13 42" />
          <path d="M79 318c42 8 87 8 132 0M311 329c42 4 83 2 123-8" />
        </g>
      </svg>
    );
  }

  return (
    <svg className={styles.art} aria-hidden="true" viewBox="0 0 520 390">
      <g className="service-sketch-fill">
        <ellipse cx="302" cy="328" rx="165" ry="18" />
      </g>
      <g className="service-sketch-lines">
        <path d="M176 75h176c12 0 21 9 21 21v156c0 12-9 21-21 21H176c-12 0-21-9-21-21V96c0-12 9-21 21-21Z" />
        <path d="M165 103h198M190 118h120M190 140h143M190 162h128M190 184h137" />
        <path d="M145 96c-14 0-22 9-22 22v134c0 13 8 22 22 22M137 111h20M137 134h20M137 157h20M137 180h20M137 203h20M137 226h20M137 249h20" />
        <path d="M202 209c14-14 28-14 42 0M263 209c14-14 28-14 42 0M324 209c14-14 28-14 42 0" />
        <path d="M92 286l61-30 51 31-59 29-53-30Z" />
        <path d="M205 286l61-30 51 31-59 29-53-30ZM318 286l61-30 51 31-59 29-53-30Z" />
        <path d="M119 286c9-14 24-14 33 0-9 15-24 15-33 0ZM231 286c7-13 23-13 31 0-8 13-24 13-31 0ZM344 286l12-9 12 9-12 9-12-9Z" />
        <path d="M410 106c18-30 47-37 72-18 24 19 26 51 6 74-16 18-42 23-64 10" />
        <path d="M445 79c-8 18-9 39-4 60M464 84c-5 18-4 34 2 50M433 99c14-4 27-2 39 6" />
        <path d="M426 164c0 20 13 35 33 35s34-15 34-35" />
        <path d="M439 198l-7 47h53l-8-47" />
        <path d="M397 232c-18-11-39-7-49 9-9 15-3 35 13 43 15 8 34 4 44-10 10 12 28 15 42 8 16-8 23-26 15-42-8-16-27-23-44-16-5-7-12-12-21-14Z" />
        <path d="M370 248h21M378 238v21M422 244h20M430 235v20" />
      </g>
    </svg>
  );
}
