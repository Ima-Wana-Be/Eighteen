"use strict";
// @ts-nocheck
/* Eighteen — standalone build. React is provided as a global (UMD). */
const { useState, useEffect, useMemo, useCallback, useRef } = React;
function Svg({ size = 18, strokeWidth = 2, children, ...p }) {
    return React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth, strokeLinecap: "round", strokeLinejoin: "round", ...p }, children);
}
const Wand2 = (p) => React.createElement(Svg, { ...p },
    React.createElement("path", { d: "M5 19 L15 9" }),
    React.createElement("path", { d: "M13 7 l4 4" }),
    React.createElement("path", { d: "M18 3 l.7 1.8 1.8 .7 -1.8 .7 -.7 1.8 -.7 -1.8 -1.8 -.7 1.8 -.7 z" }));
const Pencil = (p) => React.createElement(Svg, { ...p },
    React.createElement("path", { d: "M12 20 L20 20" }),
    React.createElement("path", { d: "M16 4 a1.8 1.8 0 0 1 2.6 2.6 L7 18 l-3.6 .9 .9 -3.6 z" }));
const Eraser = (p) => React.createElement(Svg, { ...p },
    React.createElement("path", { d: "M8 18.5 l-4.5 -4.5 a1.5 1.5 0 0 1 0 -2.1 l7.5 -7.5 a1.5 1.5 0 0 1 2.1 0 l4.5 4.5 a1.5 1.5 0 0 1 0 2.1 l-7 7 z" }),
    React.createElement("path", { d: "M20 18.5 L9 18.5" }));
const Undo2 = (p) => React.createElement(Svg, { ...p },
    React.createElement("path", { d: "M9 13 L5 9 L9 5" }),
    React.createElement("path", { d: "M5 9 H14 a4.5 4.5 0 0 1 0 9 H9" }));
const Check = (p) => React.createElement(Svg, { ...p },
    React.createElement("path", { d: "M5 12.5 L10 17.5 L19 7" }));
const Sparkles = (p) => React.createElement(Svg, { ...p },
    React.createElement("path", { d: "M12 3 l1.6 4.4 4.4 1.6 -4.4 1.6 -1.6 4.4 -1.6 -4.4 -4.4 -1.6 4.4 -1.6 z" }),
    React.createElement("path", { d: "M19 14 l.6 1.6 1.6 .6 -1.6 .6 -.6 1.6 -.6 -1.6 -1.6 -.6 1.6 -.6 z" }));
const Download = (p) => React.createElement(Svg, { ...p },
    React.createElement("path", { d: "M12 3 L12 15" }),
    React.createElement("path", { d: "M7 10 L12 15 L17 10" }),
    React.createElement("path", { d: "M5 20 L19 20" }));
const Upload = (p) => React.createElement(Svg, { ...p },
    React.createElement("path", { d: "M12 16 L12 4" }),
    React.createElement("path", { d: "M7 9 L12 4 L17 9" }),
    React.createElement("path", { d: "M5 20 L19 20" }));
const Copy = (p) => React.createElement(Svg, { ...p },
    React.createElement("rect", { x: "9", y: "9", width: "11", height: "11", rx: "2" }),
    React.createElement("path", { d: "M5 15 H4 a2 2 0 0 1 -2 -2 V4 a2 2 0 0 1 2 -2 h9 a2 2 0 0 1 2 2 v1" }));
const X = (p) => React.createElement(Svg, { ...p },
    React.createElement("path", { d: "M18 6 L6 18" }),
    React.createElement("path", { d: "M6 6 L18 18" }));
/* ------------------------------------------------------------------ *
 * Eighteen — an 8x8 Sudoku variant
 *   - each row uses 1..8 exactly once
 *   - each column uses 1..8 exactly once
 *   - every 2x2 block must total 18  (the grid's average, 4 x 4.5)
 * The block chip shows the running total and "settles" to green at 18.
 * ------------------------------------------------------------------ */
const N = 8;
const FULL = 0xff;
const bit = (v) => 1 << (v - 1);
const popcount = (x) => { let c = 0; while (x) {
    x &= x - 1;
    c++;
} return c; };
const bitsToVals = (m) => { const a = []; for (let v = 1; v <= 8; v++)
    if (m & bit(v))
        a.push(v); return a; };
const blockIdx = (r, c) => (r >> 1) * 4 + (c >> 1);
const BC = (() => { const b = Array.from({ length: 16 }, () => []); for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
        b[blockIdx(r, c)].push([r, c]); return b; })();
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function shuffle(a, rnd) { for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
} return a; }
const clone = (g) => g.map((r) => r.slice());
function candMask(grid, rowmask, colmask, r, c) {
    let m = rowmask[r] & colmask[c];
    const cells = BC[blockIdx(r, c)];
    let filled = 0, empties = 0;
    for (const [rr, cc] of cells) {
        if (grid[rr][cc])
            filled += grid[rr][cc];
        else
            empties++;
    }
    if (empties === 1) {
        const need = 18 - filled;
        m &= need >= 1 && need <= 8 ? bit(need) : 0;
    }
    return m;
}
function genSolution(rnd) {
    const grid = Array.from({ length: N }, () => Array(N).fill(0));
    const rowmask = Array(N).fill(FULL), colmask = Array(N).fill(FULL);
    const order = [];
    for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++)
            order.push([r, c]);
    function bt(i) {
        if (i === order.length)
            return true;
        const [r, c] = order[i];
        const vals = shuffle(bitsToVals(candMask(grid, rowmask, colmask, r, c)), rnd);
        for (const v of vals) {
            grid[r][c] = v;
            rowmask[r] &= ~bit(v);
            colmask[c] &= ~bit(v);
            if (bt(i + 1))
                return true;
            grid[r][c] = 0;
            rowmask[r] |= bit(v);
            colmask[c] |= bit(v);
        }
        return false;
    }
    return bt(0) ? grid : null;
}
function countSolutions(puzzle, limit, nodeCap) {
    const grid = clone(puzzle);
    const rowmask = Array(N).fill(FULL), colmask = Array(N).fill(FULL);
    for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++) {
            const v = grid[r][c];
            if (v) {
                rowmask[r] &= ~bit(v);
                colmask[c] &= ~bit(v);
            }
        }
    let count = 0, nodes = 0, aborted = false;
    function solve() {
        if (count >= limit || aborted)
            return;
        if (++nodes > nodeCap) {
            aborted = true;
            return;
        }
        let best = null, bestm = 0, bestcnt = 99;
        for (let r = 0; r < N && bestcnt > 1; r++)
            for (let c = 0; c < N; c++) {
                if (grid[r][c] === 0) {
                    const m = candMask(grid, rowmask, colmask, r, c), cnt = popcount(m);
                    if (cnt === 0)
                        return;
                    if (cnt < bestcnt) {
                        bestcnt = cnt;
                        best = [r, c];
                        bestm = m;
                        if (cnt === 1)
                            break;
                    }
                }
            }
        if (!best) {
            count++;
            return;
        }
        const [r, c] = best;
        for (const v of bitsToVals(bestm)) {
            grid[r][c] = v;
            rowmask[r] &= ~bit(v);
            colmask[c] &= ~bit(v);
            solve();
            grid[r][c] = 0;
            rowmask[r] |= bit(v);
            colmask[c] |= bit(v);
            if (count >= limit || aborted)
                return;
        }
    }
    solve();
    return aborted ? -1 : count;
}
function makePuzzle(solution, rnd, targetGivens) {
    const puzzle = clone(solution);
    const cells = [];
    for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++)
            cells.push([r, c]);
    shuffle(cells, rnd);
    let given = 64;
    for (const [r, c] of cells) {
        if (given <= targetGivens)
            break;
        const saved = puzzle[r][c];
        puzzle[r][c] = 0;
        if (countSolutions(puzzle, 2, 200000) !== 1)
            puzzle[r][c] = saved;
        else
            given--;
    }
    return puzzle;
}
const DIFFS = { Easy: 40, Medium: 32, Hard: 26 };
function newGame(diff) {
    const rnd = rng((Date.now() ^ (Math.random() * 1e9)) >>> 0);
    const solution = genSolution(rnd);
    const givens = makePuzzle(solution, rnd, DIFFS[diff]);
    return { solution, givens, values: clone(givens), notes: Array.from({ length: N }, () => Array(N).fill(0)) };
}
const flat = (g) => g.map((r) => r.join("")).join("");
const un8 = (str) => { const g = []; for (let r = 0; r < 8; r++)
    g.push(str.slice(r * 8, r * 8 + 8).split("").map(Number)); return g; };
function encodeGame(diff, givens, solution, values, notes) {
    return btoa(JSON.stringify({ v: 1, d: diff, g: flat(givens), s: flat(solution), x: flat(values), n: notes.flat() }));
}
function decodeGame(code) {
    const p = JSON.parse(atob(code.trim()));
    const ok = (s) => typeof s === "string" && s.length === 64 && /^[0-8]{64}$/.test(s);
    if (!p || !ok(p.g) || !/^[1-8]{64}$/.test(p.s || "") || !ok(p.x) || !Array.isArray(p.n) || p.n.length !== 64)
        throw new Error("bad code");
    const solution = un8(p.s), givens = un8(p.g), values = un8(p.x);
    const notes = [];
    for (let r = 0; r < 8; r++)
        notes.push(p.n.slice(r * 8, r * 8 + 8).map((x) => (x | 0) & 0xff));
    // solution must satisfy the variant's rules
    for (let r = 0; r < 8; r++) {
        const a = new Set(solution[r]);
        if (a.size !== 8)
            throw new Error("bad code");
    }
    for (let c = 0; c < 8; c++) {
        const a = new Set();
        for (let r = 0; r < 8; r++)
            a.add(solution[r][c]);
        if (a.size !== 8)
            throw new Error("bad code");
    }
    for (const cells of BC) {
        let s = 0;
        for (const [r, c] of cells)
            s += solution[r][c];
        if (s !== 18)
            throw new Error("bad code");
    }
    return { game: { solution, givens, values, notes }, diff: DIFFS[p.d] ? p.d : "Medium" };
}
/* seven-segment numeric display, drawn as SVG polygons */
const SEG_ON = {
    "0": "abcdef", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc",
    "5": "afgcd", "6": "afgecd", "7": "abc", "8": "abcdefg", "9": "abcdfg",
};
function SevenSeg({ value = "18", height = 30, color = "#1B2A29" }) {
    const t = 8, pad = 5, W = 42, H = 74, h = t / 2;
    const xL = pad, xR = W - pad, yT = pad, yM = H / 2, yB = H - pad;
    const hbar = (cy) => `${xL + h},${cy - h} ${xR - h},${cy - h} ${xR},${cy} ${xR - h},${cy + h} ${xL + h},${cy + h} ${xL},${cy}`;
    const vbar = (cx, y1, y2) => `${cx - h},${y1 + h} ${cx},${y1} ${cx + h},${y1 + h} ${cx + h},${y2 - h} ${cx},${y2} ${cx - h},${y2 - h}`;
    const seg = { a: hbar(yT), g: hbar(yM), d: hbar(yB), f: vbar(xL, yT, yM), b: vbar(xR, yT, yM), e: vbar(xL, yM, yB), c: vbar(xR, yM, yB) };
    const digits = String(value).split("");
    const gap = 9;
    const totalW = digits.length * W + (digits.length - 1) * gap;
    return (React.createElement("svg", { height: height, viewBox: `0 0 ${totalW} ${H}`, role: "img", "aria-label": String(value), style: { display: "block" } }, digits.map((d, i) => {
        const on = new Set((SEG_ON[d] || "").split(""));
        return (React.createElement("g", { key: i, transform: `translate(${i * (W + gap)},0)` }, Object.entries(seg).map(([name, pts]) => (React.createElement("polygon", { key: name, points: pts, fill: color, opacity: on.has(name) ? 1 : 0.09 })))));
    })));
}
/* ---------------------------------- theme --------------------------------- */
const T = {
    page: "#E4E8E5", panel: "#F7F9F6", ink: "#1B2A29", sub: "#5C6A67",
    cell: "#FCFCFA", given: "#ECEFEA", givenInk: "#1B2A29", userInk: "#2F6E8F",
    thickLine: "#27403E", thinLine: "#C7CDC6",
    amber: "#CC8F2E", selBg: "#F6E7C4", peer: "#EDF0EA", sameNum: "#F3E7CC",
    green: "#2C8A66", greenSoft: "#E4F1EA", red: "#BD4334", redSoft: "#F6DBD6",
    neutral: "#909A95", line: "#D7DCD7",
};
const css = `
.eg-wrap{min-height:100%;background:${T.page};color:${T.ink};
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  padding:18px 14px 40px;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
.eg-inner{max-width:480px;margin:0 auto;}
.eg-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:2px;}
.eg-title{font-size:26px;font-weight:800;letter-spacing:-.02em;margin:0;line-height:1;}
.eg-title b{color:${T.green};}
.eg-kick{font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:${T.sub};}
.eg-rule{font-size:12.5px;color:${T.sub};margin:8px 0 14px;line-height:1.45;}
.eg-rule strong{color:${T.ink};font-weight:700;}
.eg-seg{display:flex;background:${T.panel};border:1px solid ${T.line};border-radius:11px;padding:3px;gap:3px;}
.eg-seg button{flex:1;border:0;background:transparent;color:${T.sub};font-size:13px;font-weight:700;
  padding:8px 4px;border-radius:8px;cursor:pointer;transition:.15s;}
.eg-seg button[data-on="1"]{background:${T.ink};color:#fff;}
.eg-bar{display:flex;gap:8px;margin:10px 0 16px;}
.eg-new{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;border:0;cursor:pointer;
  background:${T.green};color:#fff;font-size:14px;font-weight:800;padding:12px;border-radius:11px;transition:.15s;}
.eg-new:active{transform:translateY(1px);}

.eg-board{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;background:${T.thickLine};
  padding:14px;border-radius:14px;width:min(94vw,452px);margin:0 auto;
  box-shadow:0 10px 30px -16px rgba(20,40,38,.55);}
.eg-block{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:2px;background:${T.thinLine};
  border-radius:3px;}
.eg-cell{aspect-ratio:1/1;background:${T.cell};display:flex;align-items:center;justify-content:center;
  position:relative;cursor:pointer;user-select:none;font-variant-numeric:tabular-nums;
  font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:clamp(17px,5.6vw,25px);font-weight:600;}
.eg-cell:focus-visible{outline:2px solid ${T.amber};outline-offset:-2px;z-index:3;}
.eg-notes{position:absolute;inset:8%;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);
  gap:0;font-family:ui-monospace,monospace;}
.eg-notes span{font-size:clamp(8px,2.6vw,11px);font-weight:600;color:${T.sub};
  display:flex;align-items:center;justify-content:center;line-height:1;}
.eg-chip{position:absolute;top:-14px;right:3px;z-index:4;min-width:18px;height:14px;padding:0 4px;
  display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:10.5px;font-weight:800;
  font-family:ui-monospace,monospace;font-variant-numeric:tabular-nums;letter-spacing:-.02em;
  border:1.5px solid ${T.neutral};color:${T.neutral};background:rgba(252,252,250,.96);transition:.18s;}

.eg-pad{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:16px;}
.eg-num{position:relative;background:${T.panel};border:1px solid ${T.line};border-radius:11px;cursor:pointer;
  padding:13px 0 14px;font-family:ui-monospace,monospace;font-size:22px;font-weight:700;color:${T.ink};transition:.12s;}
.eg-num:active{transform:translateY(1px);}
.eg-num[data-done="1"]{color:${T.line};background:${T.page};}
.eg-num:disabled{cursor:default;color:${T.line};background:${T.page};}
.eg-num:disabled:active{transform:none;}
.eg-num small{position:absolute;bottom:3px;right:6px;font-size:9px;font-weight:700;color:${T.sub};font-family:inherit;}
.eg-tools{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px;}
.eg-tool{display:flex;align-items:center;justify-content:center;gap:7px;background:${T.panel};
  border:1px solid ${T.line};border-radius:11px;cursor:pointer;padding:11px 0;font-size:13px;font-weight:700;color:${T.ink};transition:.12s;}
.eg-tool:active{transform:translateY(1px);}
.eg-tool[data-on="1"]{background:${T.ink};color:#fff;border-color:${T.ink};}
.eg-foot{font-size:11.5px;color:${T.sub};margin-top:16px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;line-height:1.4;}
.eg-dot{display:inline-block;width:9px;height:9px;border-radius:3px;vertical-align:-1px;margin-right:4px;}
.eg-win{margin-top:14px;background:${T.greenSoft};border:1px solid ${T.green};color:${T.green};
  border-radius:12px;padding:14px;display:flex;align-items:center;gap:10px;font-weight:800;font-size:15px;}
.eg-panel{margin-top:8px;background:${T.panel};border:1px solid ${T.line};border-radius:12px;padding:12px;}
.eg-phead{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
.eg-phead h3{margin:0;font-size:13px;font-weight:800;letter-spacing:.01em;}
.eg-x{background:transparent;border:0;color:${T.sub};cursor:pointer;padding:2px;display:flex;}
.eg-ta{width:100%;box-sizing:border-box;resize:vertical;min-height:62px;font-family:ui-monospace,monospace;
  font-size:11px;line-height:1.45;color:${T.ink};background:${T.cell};border:1px solid ${T.line};
  border-radius:8px;padding:8px;word-break:break-all;}
.eg-prow{display:flex;gap:8px;margin-top:8px;}
.eg-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;border:0;cursor:pointer;
  background:${T.ink};color:#fff;font-size:13px;font-weight:700;padding:10px;border-radius:9px;}
.eg-btn.ghost{background:transparent;color:${T.ink};border:1px solid ${T.line};}
.eg-err{color:${T.red};font-size:12px;margin-top:8px;font-weight:600;line-height:1.4;}
.eg-hint{color:${T.sub};font-size:11.5px;margin-top:8px;line-height:1.45;}
@media (prefers-reduced-motion: reduce){.eg-wrap *{transition:none!important;}}
`;
function EighteenSudoku() {
    const [diff, setDiff] = useState("Medium");
    const [game, setGame] = useState(() => newGame("Medium"));
    const [values, setValues] = useState(game.values);
    const [notes, setNotes] = useState(game.notes);
    const [sel, setSel] = useState([0, 0]);
    const [notesMode, setNotesMode] = useState(false);
    const [showErr, setShowErr] = useState(false);
    const [autoClear, setAutoClear] = useState(true);
    const [panel, setPanel] = useState(null); // null | "export" | "import"
    const [importText, setImportText] = useState("");
    const [importErr, setImportErr] = useState("");
    const [copied, setCopied] = useState(false);
    const [history, setHistory] = useState([]);
    const boardRef = useRef(null);
    const start = useCallback((d) => {
        const g = newGame(d);
        setGame(g);
        setValues(g.values);
        setNotes(g.notes);
        setHistory([]);
        setShowErr(false);
        setSel([0, 0]);
        setPanel(null);
    }, []);
    const loadGame = useCallback((g, d) => {
        setGame({ solution: g.solution, givens: g.givens });
        setValues(clone(g.values));
        setNotes(clone(g.notes));
        setDiff(d);
        setHistory([]);
        setShowErr(false);
        setSel(null);
        setPanel(null);
    }, []);
    const { solution, givens } = game;
    const isGiven = (r, c) => givens[r][c] !== 0;
    // conflicts: a filled cell that duplicates a value in its row or column
    const conflicts = useMemo(() => {
        const bad = new Set();
        for (let r = 0; r < N; r++) {
            const seen = {};
            for (let c = 0; c < N; c++) {
                const v = values[r][c];
                if (v)
                    (seen[v] = seen[v] || []).push(c);
            }
            for (const v in seen)
                if (seen[v].length > 1)
                    seen[v].forEach((c) => bad.add(r + "," + c));
        }
        for (let c = 0; c < N; c++) {
            const seen = {};
            for (let r = 0; r < N; r++) {
                const v = values[r][c];
                if (v)
                    (seen[v] = seen[v] || []).push(r);
            }
            for (const v in seen)
                if (seen[v].length > 1)
                    seen[v].forEach((r) => bad.add(r + "," + c));
        }
        return bad;
    }, [values]);
    const blockState = useMemo(() => BC.map((cells) => {
        let sum = 0, filled = 0;
        for (const [r, c] of cells) {
            if (values[r][c]) {
                sum += values[r][c];
                filled++;
            }
        }
        return { sum, filled };
    }), [values]);
    const remaining = useMemo(() => {
        const cnt = Array(9).fill(8);
        for (let r = 0; r < N; r++)
            for (let c = 0; c < N; c++) {
                const v = values[r][c];
                if (v)
                    cnt[v]--;
            }
        return cnt;
    }, [values]);
    const solved = useMemo(() => {
        for (let r = 0; r < N; r++)
            for (let c = 0; c < N; c++)
                if (!values[r][c])
                    return false;
        if (conflicts.size)
            return false;
        return blockState.every((b) => b.sum === 18);
    }, [values, conflicts, blockState]);
    useEffect(() => { if (solved)
        setSel(null); }, [solved]);
    const applyMove = useCallback((mut) => {
        setHistory((h) => [...h, { values: clone(values), notes: clone(notes) }].slice(-120));
        const v = clone(values), n = clone(notes);
        mut(v, n);
        setValues(v);
        setNotes(n);
    }, [values, notes]);
    const placeDigit = useCallback((d) => {
        if (solved)
            return;
        if (!sel)
            return;
        const [r, c] = sel;
        if (isGiven(r, c))
            return;
        if (notesMode && values[r][c] !== 0)
            return;
        if (notesMode && remaining[d] <= 0)
            return;
        if (!notesMode && values[r][c] !== d && remaining[d] <= 0)
            return;
        applyMove((v, n) => {
            if (notesMode) {
                if (v[r][c] !== 0)
                    return;
                n[r][c] ^= bit(d);
            }
            else {
                if (v[r][c] === d) {
                    v[r][c] = 0;
                    return;
                }
                v[r][c] = d;
                n[r][c] = 0;
                if (autoClear) {
                    // a value appears once per row and once per column, so clear those.
                    // NOT the block: diagonal cells in a 2x2 may legitimately repeat.
                    for (let k = 0; k < N; k++) {
                        n[r][k] &= ~bit(d);
                        n[k][c] &= ~bit(d);
                    }
                    // if this completes the digit (all 8 placed, no conflicts), it can't go
                    // anywhere else — clear its notes everywhere
                    let cnt = 0;
                    const rs = new Set(), cs = new Set();
                    for (let i = 0; i < N; i++)
                        for (let j = 0; j < N; j++)
                            if (v[i][j] === d) {
                                cnt++;
                                rs.add(i);
                                cs.add(j);
                            }
                    if (cnt === 8 && rs.size === 8 && cs.size === 8)
                        for (let i = 0; i < N; i++)
                            for (let j = 0; j < N; j++)
                                n[i][j] &= ~bit(d);
                }
            }
        });
    }, [sel, notesMode, applyMove, solved, givens, values, remaining, autoClear]);
    const erase = useCallback(() => {
        if (!sel)
            return;
        const [r, c] = sel;
        if (isGiven(r, c))
            return;
        if (values[r][c] === 0 && notes[r][c] === 0)
            return;
        applyMove((v, n) => { v[r][c] = 0; n[r][c] = 0; });
    }, [sel, values, notes, applyMove, givens]);
    const undo = useCallback(() => {
        setHistory((h) => {
            if (!h.length)
                return h;
            const last = h[h.length - 1];
            setValues(last.values);
            setNotes(last.notes);
            return h.slice(0, -1);
        });
    }, []);
    const exportCode = useMemo(() => encodeGame(diff, givens, solution, values, notes), [diff, givens, solution, values, notes]);
    const copyCode = useCallback(() => {
        var _a;
        const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1600); };
        if ((_a = navigator.clipboard) === null || _a === void 0 ? void 0 : _a.writeText)
            navigator.clipboard.writeText(exportCode).then(done).catch(done);
        else
            done();
    }, [exportCode]);
    const doImport = useCallback(() => {
        try {
            const { game: g, diff: d } = decodeGame(importText);
            loadGame(g, d);
            setImportText("");
            setImportErr("");
        }
        catch (e) {
            setImportErr("That code couldn't be read. Paste a full code exported from Eighteen.");
        }
    }, [importText, loadGame]);
    // keyboard support
    useEffect(() => {
        const onKey = (e) => {
            if (e.key >= "1" && e.key <= "8") {
                placeDigit(+e.key);
                e.preventDefault();
            }
            else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
                erase();
                e.preventDefault();
            }
            else if (e.key.toLowerCase() === "n")
                setNotesMode((m) => !m);
            else if ((e.key.toLowerCase() === "u") || (e.key === "z" && (e.metaKey || e.ctrlKey))) {
                undo();
                e.preventDefault();
            }
            else if (e.key.startsWith("Arrow")) {
                e.preventDefault();
                if (!sel) {
                    setSel([0, 0]);
                    return;
                }
                const [r, c] = sel;
                if (e.key === "ArrowUp")
                    setSel([Math.max(0, r - 1), c]);
                else if (e.key === "ArrowDown")
                    setSel([Math.min(7, r + 1), c]);
                else if (e.key === "ArrowLeft")
                    setSel([r, Math.max(0, c - 1)]);
                else if (e.key === "ArrowRight")
                    setSel([r, Math.min(7, c + 1)]);
            }
            else if (e.key === "Escape")
                setSel(null);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [sel, placeDigit, erase, undo]);
    const selVal = sel ? values[sel[0]][sel[1]] : 0;
    function cellStyle(r, c) {
        const isSel = !!sel && sel[0] === r && sel[1] === c;
        const v = values[r][c];
        const isPeer = !!sel && (sel[0] === r || sel[1] === c || blockIdx(r, c) === blockIdx(sel[0], sel[1]));
        const isSame = v !== 0 && v === selVal;
        const isConf = conflicts.has(r + "," + c);
        const isWrong = showErr && v !== 0 && !isGiven(r, c) && v !== solution[r][c];
        let bg = T.cell, color = isGiven(r, c) ? T.givenInk : T.userInk;
        if (isGiven(r, c))
            bg = T.given;
        if (isPeer && !isSel)
            bg = T.peer;
        if (isSame && !isSel)
            bg = T.sameNum;
        if (isConf || isWrong) {
            bg = T.redSoft;
            color = T.red;
        }
        if (isSel)
            bg = T.selBg;
        const style = { background: bg, color, fontWeight: isGiven(r, c) ? 700 : 600 };
        if (isSel)
            style.boxShadow = `inset 0 0 0 2px ${T.amber}`;
        if (isWrong)
            style.boxShadow = `inset 0 0 0 2px ${T.red}`;
        return style;
    }
    function chipStyle(b) {
        const { sum, filled } = b;
        let border = T.neutral, color = T.neutral, background = "rgba(252,252,250,.92)";
        if (filled === 4 && sum === 18) {
            border = T.green;
            color = "#fff";
            background = T.green;
        }
        else if (sum > 18) {
            border = T.red;
            color = T.red;
            background = T.redSoft;
        }
        else if (filled === 4 && sum !== 18) {
            border = T.amber;
            color = T.amber;
            background = "#FBF1DA";
        }
        return { borderColor: border, color, background };
    }
    return (React.createElement("div", { className: "eg-wrap" },
        React.createElement("style", null, css),
        React.createElement("div", { className: "eg-inner" },
            React.createElement("div", { className: "eg-top" },
                React.createElement("h1", { className: "eg-title" },
                    "Eighteen",
                    React.createElement("b", null, ".")),
                React.createElement(SevenSeg, { value: "18", height: 30, color: "#1B2A29" })),
            React.createElement("p", { className: "eg-rule" },
                "Fill every row and column with ",
                React.createElement("strong", null, "1\u20138"),
                ", no repeats. Each",
                " ",
                React.createElement("strong", null, "2\u00D72 block"),
                " must total ",
                React.createElement("strong", null, "18"),
                " \u2014 watch the corner chip settle to ",
                React.createElement("span", { style: { color: T.green, fontWeight: 700 } }, "green"),
                " when it balances."),
            React.createElement("div", { className: "eg-seg", role: "tablist", "aria-label": "Difficulty" }, Object.keys(DIFFS).map((d) => (React.createElement("button", { key: d, "data-on": diff === d ? 1 : 0, onClick: () => { setDiff(d); start(d); } }, d)))),
            React.createElement("div", { className: "eg-bar" },
                React.createElement("button", { className: "eg-new", onClick: () => start(diff) },
                    React.createElement(Wand2, { size: 17, strokeWidth: 2.4 }),
                    " New puzzle")),
            React.createElement("div", { className: "eg-board", ref: boardRef }, Array.from({ length: 16 }, (_, b) => {
                const br = (b >> 2) * 2, bc = (b & 3) * 2;
                const cells = [[br, bc], [br, bc + 1], [br + 1, bc], [br + 1, bc + 1]];
                const st = blockState[b];
                const balanced = st.filled === 4 && st.sum === 18;
                return (React.createElement("div", { className: "eg-block", key: b, style: balanced ? { background: T.green } : undefined },
                    React.createElement("div", { className: "eg-chip", style: chipStyle(st), title: "Target 18" }, st.sum),
                    cells.map(([r, c]) => {
                        const v = values[r][c];
                        const noteBits = notes[r][c];
                        return (React.createElement("div", { key: r + "-" + c, className: "eg-cell", style: cellStyle(r, c), tabIndex: 0, role: "button", "aria-label": `Row ${r + 1} column ${c + 1}${v ? ", " + v : ", empty"}`, onClick: () => setSel((s) => (s && s[0] === r && s[1] === c ? null : [r, c])) }, v ? v : (noteBits ? (React.createElement("div", { className: "eg-notes" }, [1, 2, 3, 4, 5, 6, 7, 8].map((d) => (React.createElement("span", { key: d }, noteBits & bit(d) ? d : ""))))) : null)));
                    })));
            })),
            solved && (React.createElement("div", { className: "eg-win" },
                React.createElement(Sparkles, { size: 20 }),
                " Balanced. Every block totals 18 \u2014 solved!")),
            React.createElement("div", { className: "eg-pad" }, [1, 2, 3, 4, 5, 6, 7, 8].map((d) => (React.createElement("button", { key: d, className: "eg-num", "data-done": remaining[d] <= 0 ? 1 : 0, disabled: remaining[d] <= 0, onClick: () => placeDigit(d) },
                d,
                React.createElement("small", null, remaining[d] > 0 ? remaining[d] : ""))))),
            React.createElement("div", { className: "eg-tools" },
                React.createElement("button", { className: "eg-tool", "data-on": notesMode ? 1 : 0, onClick: () => setNotesMode((m) => !m) },
                    React.createElement(Pencil, { size: 15 }),
                    " Notes",
                    notesMode ? " on" : ""),
                React.createElement("button", { className: "eg-tool", onClick: erase },
                    React.createElement(Eraser, { size: 15 }),
                    " Erase"),
                React.createElement("button", { className: "eg-tool", onClick: undo, disabled: !history.length, style: !history.length ? { opacity: .45 } : undefined },
                    React.createElement(Undo2, { size: 15 }),
                    " Undo")),
            React.createElement("div", { className: "eg-tools", style: { gridTemplateColumns: "1fr" } },
                React.createElement("button", { className: "eg-tool", "data-on": showErr ? 1 : 0, onClick: () => setShowErr((s) => !s) },
                    React.createElement(Check, { size: 15 }),
                    " ",
                    showErr ? "Hide mistakes" : "Check mistakes")),
            React.createElement("div", { className: "eg-tools", style: { gridTemplateColumns: "1fr" } },
                React.createElement("button", { className: "eg-tool", "data-on": autoClear ? 1 : 0, onClick: () => setAutoClear((s) => !s) },
                    React.createElement(Pencil, { size: 15 }),
                    " Auto-clear notes: ",
                    autoClear ? "on" : "off")),
            React.createElement("div", { className: "eg-tools", style: { gridTemplateColumns: "1fr 1fr" } },
                React.createElement("button", { className: "eg-tool", "data-on": panel === "export" ? 1 : 0, onClick: () => { setPanel(panel === "export" ? null : "export"); setImportErr(""); } },
                    React.createElement(Download, { size: 15 }),
                    " Export"),
                React.createElement("button", { className: "eg-tool", "data-on": panel === "import" ? 1 : 0, onClick: () => { setPanel(panel === "import" ? null : "import"); setImportErr(""); } },
                    React.createElement(Upload, { size: 15 }),
                    " Import")),
            panel === "export" && (React.createElement("div", { className: "eg-panel" },
                React.createElement("div", { className: "eg-phead" },
                    React.createElement("h3", null, "Export code"),
                    React.createElement("button", { className: "eg-x", "aria-label": "Close", onClick: () => setPanel(null) },
                        React.createElement(X, { size: 16 }))),
                React.createElement("textarea", { className: "eg-ta", readOnly: true, value: exportCode, onFocus: (e) => e.target.select() }),
                React.createElement("div", { className: "eg-prow" },
                    React.createElement("button", { className: "eg-btn", onClick: copyCode },
                        React.createElement(Copy, { size: 15 }),
                        " ",
                        copied ? "Copied" : "Copy code")),
                React.createElement("div", { className: "eg-hint" }, "Saves the puzzle and your current progress. Paste it into Import on any device to pick up where you left off."))),
            panel === "import" && (React.createElement("div", { className: "eg-panel" },
                React.createElement("div", { className: "eg-phead" },
                    React.createElement("h3", null, "Import code"),
                    React.createElement("button", { className: "eg-x", "aria-label": "Close", onClick: () => setPanel(null) },
                        React.createElement(X, { size: 16 }))),
                React.createElement("textarea", { className: "eg-ta", placeholder: "Paste an Eighteen code here\u2026", value: importText, onChange: (e) => { setImportText(e.target.value); setImportErr(""); } }),
                React.createElement("div", { className: "eg-prow" },
                    React.createElement("button", { className: "eg-btn ghost", onClick: () => { setImportText(""); setImportErr(""); } }, "Clear"),
                    React.createElement("button", { className: "eg-btn", onClick: doImport, disabled: !importText.trim(), style: !importText.trim() ? { opacity: .5 } : undefined }, "Load puzzle")),
                importErr && React.createElement("div", { className: "eg-err" }, importErr))),
            React.createElement("div", { className: "eg-foot" },
                React.createElement("span", null,
                    React.createElement("span", { className: "eg-dot", style: { background: T.neutral } }),
                    "building"),
                React.createElement("span", null,
                    React.createElement("span", { className: "eg-dot", style: { background: T.green } }),
                    "18 \u2713"),
                React.createElement("span", null,
                    React.createElement("span", { className: "eg-dot", style: { background: T.red } }),
                    "over 18"),
                React.createElement("span", { style: { width: "100%", marginTop: 2 } }, "Tip: tap a cell, then a number. Keyboard: 1\u20138 to fill, N for notes, U to undo, arrows to move.")))));
}
const _root = ReactDOM.createRoot(document.getElementById("root"));
_root.render(React.createElement(EighteenSudoku, null));
