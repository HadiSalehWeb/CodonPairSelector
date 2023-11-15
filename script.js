let ciruclar, c3, commaFree;

Promise.all([
    fetch('data/CircularCodes-table.json'),
    fetch('data/CircularCodes-vectors.json'),
    fetch('data/CircularC3Codes-table.json'),
    fetch('data/CircularC3Codes-vectors.json'),
    fetch('data/CommaFree-table.json'),
    fetch('data/CommaFree-vectors.json')
]).then(([CTab, CVec, C3Tab, C3Vec, CFTab, CFVec]) =>
    Promise.all([CTab.json(), CVec.json(), C3Tab.json(), C3Vec.json(), CFTab.json(), CFVec.json()])
).then(([CTab, CVec, C3Tab, C3Vec, CFTab, CFVec]) => {
    const standardOrder = [
        'ATA',
        'CGC',
        'ACT',
        'TCA',
        'CAG',
        'GAC',
        'CAA',
        'ACC',
        'GAA',
        'AGG'

        // ['ATA', 'TAT', 'TAA', 'TTA', 'AAT', 'ATT'],
        // ['CGC', 'GCG', 'GCC', 'GGC', 'CCG', 'CGG'],
        // ['ACT', 'AGT', 'CTA', 'TAG', 'TAC', 'GTA'],
        // ['TCA', 'TGA', 'CAT', 'ATG', 'ATC', 'GAT'],
        // ['CAG', 'CTG', 'AGC', 'GCT', 'GCA', 'TGC'],
        // ['GAC', 'GTC', 'ACG', 'CGT', 'CGA', 'TCG'],
        // ['ACA', 'TGT', 'CAA', 'TTG', 'AAC', 'GTT'],
        // ['CAC', 'GTG', 'ACC', 'GGT', 'CCA', 'TGG'],
        // ['AGA', 'TCT', 'GAA', 'TTC', 'AAG', 'CTT'],
        // ['GAG', 'CTC', 'AGG', 'CCT', 'GGA', 'TCC']
    ].map(x => [x, tAnticodon(x), tAlpha1(x), tAnticodon(tAlpha1(x)), tAlpha2(x), tAnticodon(tAlpha2(x))])

    const types = [
        [0, 0, 1, 1, 1, 1],
        [0, 0, 1, 1, 1, 1],
        [2, 2, 3, 3, 3, 3],
        [2, 2, 3, 3, 3, 3],
        [2, 2, 3, 3, 3, 3],
        [2, 2, 3, 3, 3, 3],
        [4, 4, 4, 4, 5, 5],
        [4, 4, 4, 4, 5, 5],
        [4, 4, 4, 4, 5, 5],
        [4, 4, 4, 4, 5, 5],
    ]

    const createTable = tab => tab.reduce((a, c, i) => {
        const row = c[0], column = c[1]
        if (!a[row]) a[row] = []
        a[row][column] = {
            id: i,
            label: i + 1,
            row,
            column
        }
        return a
    }, [])

    const tables = {
        C: createTable(CTab),
        C3: createTable(C3Tab),
        CF: createTable(CFTab)
    }

    const vectors = {
        C: CVec,
        C3: C3Vec,
        CF: CFVec
    }

    const functions = {
        C: isCircular,
        C3: isC3,
        CF: isCommaFree
    }

    const currentSymbol = _ => guiState['Type'] === 'Comma-free' ? 'CF' : guiState['Type'] === 'Circular' ? 'C' : 'C3'

    const state = {
        included: Array(10).fill(0).map(_ => Array(6).fill(false)),
        excluded: Array(10).fill(0).map(_ => Array(6).fill(false)),
    }

    // in comma free, if complimentarity is picked to obey, make it ingore maximality and grey it out. If maximality is obeyed, make complimentarity ignore and grey it out.

    const toggle = function (row, column) {
        state.included[row][column] = !state.included[row][column]
        if (guiState["Self-complimentarity"] === 'Obey') state.included[row][column + (column % 2 === 0 ? 1 : -1)] = state.included[row][column]
        updateLogic()
        update()
    }

    const setState = function (vector) {
        state.included = guiState["Self-complimentarity"] === 'Obey' ? vector.map(row => row.map((x, i) => Boolean(x || row[i + (i % 2 === 0 ? 1 : -1)]))) : vector.map(row => row.map(Boolean))
        updateLogic()
        update()
    }

    const updateLogic = function () {
        const includedCodons = state.included.flatMap((row, i) => row.map((elem, j) => elem ? standardOrder[i][j] : -1).filter(x => x !== -1))

        if (guiState['Maximality'] === 'Obey')
            state.excluded = vectors[currentSymbol()]
                .filter(vector => vector.every((row, i) => row.every((elem, j) => !state.included[i][j] || elem)))
                .reduce((a, c) => a.map((row, i) => row.map((x, j) => x || c[i][j])), Array(10).fill(0).map(_ => Array(6).fill(false)))
                .map(row => row.map(elem => !elem))
        else {
            state.excluded = standardOrder.map((row, i) =>
                row.map((x, j) => state.included[i][j] ? false : !functions[currentSymbol()](includedCodons.concat(guiState['Self-complimentarity'] === 'Obey' ? [x, standardOrder[i][j + (j % 2 === 0 ? 1 : -1)]] : [x])))
            )
        }
    }

    const codonTableContainer = document.getElementById('codon-table')
    const codesTableContainer = document.getElementById('codes-table')
    let codesTable;
    const build = function () {
        buildCodonTable()
        buildCodesTable()
    }

    const buildCodonTable = function () {
        const table = document.createElement('table')

        const thead = document.createElement('thead')
        thead.innerHTML = `<tr><th colspan="2">1</th><th colspan="2">2</th><th colspan="2">3</th></tr>`
        table.appendChild(thead)

        const tbody = document.createElement('tbody')
        tbody.innerHTML = standardOrder.map((row, i) => `<tr>${row.map((elem, j) => `<td class='${'type' + types[i][j]}'>${elem}</td>`).join('')}</tr>`).join('');
        [...tbody.children].forEach(row => [...row.children].forEach(td => td.addEventListener('click', e =>
            toggle([...e.target.parentElement.parentElement.children].indexOf(e.target.parentElement), [...e.target.parentElement.children].indexOf(e.target))
        )))
        table.appendChild(tbody)

        codonTableContainer.appendChild(table)
    }

    const buildCodesTable = function () {
        for (let type of ['CF', 'C', 'C3']) {
            const table = document.createElement('table')

            const thead = document.createElement('thead')
            thead.innerHTML = `<tr><th>#</th><th>I</th><th>c</th><th>p</th><th>r</th><th>PI_CG</th><th>PI_AT</th><th>PI_ACTG</th><th>PI_AGTC</th></tr>`

            table.appendChild(thead)

            const tbody = document.createElement('tbody')
            tbody.innerHTML = tables[type].map((row, i) => `<tr><td>${i + 1}</td>${row.map(elem => `<td data-id="${elem.id}">${elem.label}</td>`).join('')}</tr>`).join('');
            [...tbody.children].forEach(row => [...row.children].slice(1).forEach(td => td.addEventListener('click', e =>
                setState(vectors[type][e.target.getAttribute('data-id')].slice(0))
            )))
            table.appendChild(tbody)

            codesTableContainer.appendChild(table)
        }
        codesTable = {
            CF: codesTableContainer.children[0],
            C: codesTableContainer.children[1],
            C3: codesTableContainer.children[2]
        }
    }
    const getCodonElement = function (i, j) {
        return codonTableContainer.children[0].children[1].children[i].children[j]
    }

    const isCompliant = function (code) {
        return state.excluded.every((row, i) => row.every((elem, j) => (!elem || code[i][j] === 0) && (!state.included[i][j] || code[i][j] === 1)))
    }

    const update = function () {
        updateCodonTable()
        updateCodesTable()
    }

    const updateCodonTable = function () {
        state.excluded.forEach((exRow, rowIndex) => exRow.forEach((elem, elemIndex) => elem ? getCodonElement(rowIndex, elemIndex).classList.add('excluded') : getCodonElement(rowIndex, elemIndex).classList.remove('excluded')))
        state.included.forEach((exRow, rowIndex) => exRow.forEach((elem, elemIndex) => elem ? getCodonElement(rowIndex, elemIndex).classList.add('included') : getCodonElement(rowIndex, elemIndex).classList.remove('included')))
    }

    const updateCodesTable = function () {
        [...codesTableContainer.children].forEach(x => x.setAttribute('style', 'display: none'))
        codesTable[currentSymbol()].setAttribute('style', 'display: block');

        [...codesTable[currentSymbol()].children[1].children].forEach(row =>
            [...row.children].slice(1).forEach(elem =>
                isCompliant((vectors[currentSymbol()])[+elem.getAttribute('data-id')]) ? elem.classList.remove('excluded') : elem.classList.add('excluded')
            )
        )
        guiState['# of codes: '] = (vectors[currentSymbol()]).filter(vector => isCompliant(vector)).length
    }

    const onTypeChanged = function () {
        if (guiState["Type"] === "Comma-free") {
            guiState["Self-complimentarity"] = 'Ignore'
            toggleSelector(scController, false)
        }
        else
            toggleSelector(scController, true)
        gui.updateDisplay()
        setState(state.included)
    }

    const onSCChanged = function () {
        setState(state.included)
    }

    const onMaximalityChanged = function () {
        setState(state.included)
    }

    const toggleSelector = function (controller, enable) {
        if (enable) controller.domElement.children[0].removeAttribute('disabled')
        else controller.domElement.children[0].setAttribute('disabled', true)
    }

    const guiState = {
        "Help": () => window.open('https://github.com/HadiSalehWeb/CodonPairSelector', '_blank'),
        "Reset": () => setState(Array(10).fill(0).map(_ => Array(6).fill(false))),
        // "Table": "Comma-free", // "Circular", "C3"
        "Type": "Comma-free", // "Circular", "C3"
        "Self-complimentarity": "Ignore", // "Ignore"
        "Maximality": "Ignore", // "Ignore"
        "# of codes: ": 0
    }

    const gui = new dat.GUI()
    gui.add(guiState, 'Help')
    gui.add(guiState, 'Reset')
    // gui.add(guiState, 'Table', ['Comma-free', 'Circular', 'C3']).onChange(_ => setState(state.included))
    gui.add(guiState, 'Type', ['Comma-free', 'Circular', 'C3']).onChange(onTypeChanged) //_ => setState(state.included))
    const scController = gui.add(guiState, 'Self-complimentarity', ['Obey', 'Ignore']).onChange(onSCChanged)//_ => setState(state.included))
    toggleSelector(scController, false)
    const mController = gui.add(guiState, 'Maximality', ['Obey', 'Ignore']).onChange(onMaximalityChanged)//_ => setState(state.included))
    // gui.add(guiState, 'C3', ['Test for C3', 'Test for circularity only']).onChange(_ => setState(state.included))
    // gui.add(guiState, 'Maximality', ['Exclude codons from non-maximal codes.', 'Ignore maximality']).onChange(_ => setState(state.included))
    // gui.add(guiState, 'Allow excluded selection').onChange(_ => setState(state.included))
    const numDisplay = gui.add(guiState, '# of codes: ').listen()
    numDisplay.domElement.style.pointerEvents = "none"
    numDisplay.domElement.children[0].style.backgroundColor = "initial"

    build()
    update()
})

const letterToNumber = x => x.split('').map(x => ['A', 'C', 'T', 'G'].indexOf(x))

// const isCircular = function (codons) {
//     codons = codons.map(x => letterToNumber(x))
//     const variations = variationsR(codons)(4)//.concat(variationsR(codons)(3))
//     for (let nucleotide of variations)
//         if (countDecompositions(nucleotide.reduce((a, c) => a.concat(c), []), codons) >= 2)
//             return false
//     return true
// }
const isCircular = function (codons) {
    return isAcyclic(codeGraph(codons))
}

const codeGraph = function (codons) {
    return [distinct(codons.flatMap(x => [x[0], x[2], x[0] + x[1], x[1] + x[2]])), codons.flatMap(x => [[x[0], x[1] + x[2]], [x[0] + x[1], x[2]]])]
}

const isAcyclic = function ([verts, links]) {
    const outgoing = verts.filter(v => !links.some(l => l[1] === v))
    if (outgoing.length === 0) return false;
    const visited = []
    return outgoing.every(x => isCycleFree([verts, links], [x], visited)) && verts.every(v => visited.includes(v))

}

const isCycleFree = function ([verts, links], list, processed) {
    if (!processed.includes(list[list.length - 1])) processed.push(list[list.length - 1])
    const nextNodes = links.filter(x => x[0] === list[list.length - 1]).map(x => x[1])
    if (nextNodes.length === 0) return true
    if (nextNodes.some(x => list.includes(x))) return false
    return nextNodes.every(x => isCycleFree([verts, links], list.concat(x), processed))
}

const distinct = arr => arr.reduce((a, c) => a.includes(c) ? a : a.concat(c), [])

const isC3 = codons => isCircular(codons) && isCircular(codons.map(x => alpha1(x))) && isCircular(codons.map(x => alpha2(x)))

const isCommaFree = codons => codons.every(x1 => codons.every(x2 => commaFreeCuts(x1, x2).every(y => !codons.includes(y))))

const commaFreeCuts = (x1, x2) => [x1[1] + x1[2] + x2[0], x1[2] + x2[0] + x2[1], x2[1] + x2[2] + x1[0], x2[2] + x1[0] + x1[1]]

const variationsR = arr => n => n <= 1 ? arr.map(x => [x]) : variationsR(arr)(n - 1).reduce((a, c) => a.concat(arr.map(x => c.concat([x]))), [])
const combinations = arr => n => n <= 1 ? arr.map(x => [x]) : arr.slice(0, arr.length - n + 1).flatMap((x, i) => combinations(arr.slice(i + 1))(n - 1).map(y => [x, ...y]))

const countDecompositions = function (nucleotide, codonSet) {
    if (nucleotide.length % 3 !== 0) return 0
    return (decomposes(nucleotide, codonSet) ? 1 : 0) +
        (decomposes(alpha1(nucleotide), codonSet) ? 1 : 0) +
        (decomposes(alpha2(nucleotide), codonSet) ? 1 : 0)
}

const decomposes = function (nucleotide, codonSet) {
    return nucleotide.length === 0 || (
        (codonSet.find(codon => codon[0] === nucleotide[0] && codon[1] === nucleotide[1] && codon[2] === nucleotide[2]) !== undefined) &&
        decomposes(nucleotide.slice(3), codonSet)
    )
}

const alpha1 = list => list.slice(1).concat([list[0]])
const alpha2 = list => list.slice(2).concat([list[0], list[1]])
const tAlpha1 = codon => codon[1] + codon[2] + codon[0]
const tAlpha2 = codon => codon[2] + codon[0] + codon[1]
const tAnticodon = codon => lAnticodon(codon[2]) + lAnticodon(codon[1]) + lAnticodon(codon[0])
const lAnticodon = l => l === 'A' ? 'T' : l === 'T' ? 'A' : l === 'G' ? 'C' : 'G'
// reverse function
// why are some codes non maximal? which combinations of condons make it so?
// text for: current code is comma free/circular/c3/maximal/self complimentary



// var codesToCheck = [
//     ['AAC', 'AAG', 'AAT', 'ACG', 'ACT', 'AGT', 'ATT', 'CAG', 'CCG', 'CGG', 'CGT', 'CTG', 'CTT', 'GGA', 'GTT', 'TCA', 'TCC', 'TGA'],
//     ['AAC', 'AAG', 'AAT', 'ACG', 'ATT', 'CAG', 'CCG', 'CGG', 'CGT', 'CTA', 'CTG', 'CTT', 'GGA', 'GTT', 'TAG', 'TCA', 'TCC', 'TGA'],
//     ['AAC', 'AAG', 'AAT', 'ACT', 'AGC', 'AGT', 'ATT', 'CCA', 'CTT', 'GAC', 'GCC', 'GCT', 'GGC', 'GTC', 'GTT', 'TCA', 'TGA', 'TGG'],
//     ['AAC', 'AAG', 'AAT', 'AGC', 'ATT', 'CCA', 'CTT', 'GAC', 'GCC', 'GCT', 'GGC', 'GTA', 'GTC', 'GTT', 'TAC', 'TCA', 'TGA', 'TGG'],
//     ['AAC', 'AAT', 'ACG', 'ACT', 'AGA', 'AGC', 'AGT', 'ATT', 'CCG', 'CGG', 'CGT', 'GCT', 'GGA', 'GTT', 'TCA', 'TCC', 'TCT', 'TGA'],
//     ['AAC', 'AAT', 'ACG', 'ACT', 'AGA', 'AGT', 'ATT', 'CAG', 'CCG', 'CGG', 'CGT', 'CTG', 'GGA', 'GTT', 'TCA', 'TCC', 'TCT', 'TGA'],
//     ['AAC', 'AGG', 'ATG', 'CAC', 'CAG', 'CAT', 'CCG', 'CCT', 'CGG', 'CTA', 'CTG', 'GAC', 'GTC', 'GTG', 'GTT', 'TAA', 'TAG', 'TTA'],
//     ['AAC', 'AGG', 'CAC', 'CAG', 'CCG', 'CCT', 'CGG', 'CTA', 'CTG', 'GAC', 'GTC', 'GTG', 'GTT', 'TAA', 'TAG', 'TCA', 'TGA', 'TTA'],
//     ['AAC', 'AGG', 'CAG', 'CCA', 'CCG', 'CCT', 'CGG', 'CTA', 'CTG', 'GAC', 'GTC', 'GTT', 'TAA', 'TAG', 'TCA', 'TGA', 'TGG', 'TTA'],
//     ['AAC', 'AGG', 'CCA', 'CCG', 'CCT', 'CGG', 'CTA', 'GAC', 'GCA', 'GTC', 'GTT', 'TAA', 'TAG', 'TCA', 'TGA', 'TGC', 'TGG', 'TTA'],
//     ['AAG', 'AAT', 'ACA', 'ACG', 'ACT', 'AGC', 'AGT', 'ATT', 'CCA', 'CGT', 'CTT', 'GCC', 'GCT', 'GGC', 'TCA', 'TGA', 'TGG', 'TGT'],
//     ['AAG', 'AAT', 'ACA', 'ACT', 'AGC', 'AGT', 'ATT', 'CCA', 'CTT', 'GAC', 'GCC', 'GCT', 'GGC', 'GTC', 'TCA', 'TGA', 'TGG', 'TGT'],
//     ['AAG', 'ACC', 'ATC', 'CAG', 'CTC', 'CTG', 'CTT', 'GAC', 'GAG', 'GAT', 'GCC', 'GGC', 'GGT', 'GTA', 'GTC', 'TAA', 'TAC', 'TTA'],
//     ['AAG', 'ACC', 'CAG', 'CGA', 'CTG', 'CTT', 'GCC', 'GGA', 'GGC', 'GGT', 'GTA', 'TAA', 'TAC', 'TCA', 'TCC', 'TCG', 'TGA', 'TTA'],
//     ['AAG', 'ACC', 'CAG', 'CTC', 'CTG', 'CTT', 'GAC', 'GAG', 'GCC', 'GGC', 'GGT', 'GTA', 'GTC', 'TAA', 'TAC', 'TCA', 'TGA', 'TTA'],
//     ['AAG', 'ACC', 'CAG', 'CTG', 'CTT', 'GAC', 'GCC', 'GGA', 'GGC', 'GGT', 'GTA', 'GTC', 'TAA', 'TAC', 'TCA', 'TCC', 'TGA', 'TTA'],
//     ['AAT', 'ACC', 'ACG', 'ACT', 'AGT', 'ATC', 'ATT', 'CAA', 'CAG', 'CGT', 'CTG', 'GAT', 'GCC', 'GGA', 'GGC', 'GGT', 'TCC', 'TTG'],
//     ['AAT', 'ACC', 'ACT', 'AGT', 'ATC', 'ATT', 'CAA', 'CAG', 'CTG', 'GAC', 'GAT', 'GCC', 'GGA', 'GGC', 'GGT', 'GTC', 'TCC', 'TTG'],
//     ['AAT', 'ACT', 'AGC', 'AGG', 'AGT', 'ATG', 'ATT', 'CAT', 'CCA', 'CCG', 'CCT', 'CGG', 'GAA', 'GAC', 'GCT', 'GTC', 'TGG', 'TTC'],
//     ['AAT', 'ACT', 'AGG', 'AGT', 'ATG', 'ATT', 'CAG', 'CAT', 'CCA', 'CCG', 'CCT', 'CGG', 'CTG', 'GAA', 'GAC', 'GTC', 'TGG', 'TTC'],
//     ['AAT', 'ACT', 'AGT', 'ATC', 'ATT', 'CAA', 'CAC', 'CAG', 'CTG', 'GAC', 'GAT', 'GCC', 'GGA', 'GGC', 'GTC', 'GTG', 'TCC', 'TTG'],
//     ['AAT', 'ACT', 'AGT', 'ATG', 'ATT', 'CAG', 'CAT', 'CCA', 'CCG', 'CGG', 'CTC', 'CTG', 'GAA', 'GAC', 'GAG', 'GTC', 'TGG', 'TTC'],
//     ['AAT', 'ATC', 'ATT', 'CAA', 'CAC', 'CAG', 'CTG', 'GAC', 'GAT', 'GCC', 'GGA', 'GGC', 'GTA', 'GTC', 'GTG', 'TAC', 'TCC', 'TTG'],
//     ['AAT', 'ATG', 'ATT', 'CAG', 'CAT', 'CCA', 'CCG', 'CGG', 'CTA', 'CTC', 'CTG', 'GAA', 'GAC', 'GAG', 'GTC', 'TAG', 'TGG', 'TTC'],
//     ['ACA', 'ACC', 'ACT', 'AGT', 'CAG', 'CCG', 'CGA', 'CGG', 'CTG', 'GAA', 'GGT', 'TAA', 'TCA', 'TCG', 'TGA', 'TGT', 'TTA', 'TTC'],
//     ['ACA', 'ACC', 'ACT', 'AGT', 'CCG', 'CGA', 'CGG', 'GAA', 'GCA', 'GGT', 'TAA', 'TCA', 'TCG', 'TGA', 'TGC', 'TGT', 'TTA', 'TTC'],
//     ['ACC', 'ACT', 'AGT', 'ATG', 'CAA', 'CAG', 'CAT', 'CCG', 'CGA', 'CGG', 'CTG', 'GAA', 'GGT', 'TAA', 'TCG', 'TTA', 'TTC', 'TTG'],
//     ['ACC', 'ACT', 'AGT', 'CAA', 'CAG', 'CCG', 'CGA', 'CGG', 'CTG', 'GAA', 'GGT', 'TAA', 'TCA', 'TCG', 'TGA', 'TTA', 'TTC', 'TTG'],
//     ['ACT', 'AGA', 'AGG', 'AGT', 'CAA', 'CCT', 'CGA', 'GCA', 'GCC', 'GGC', 'TAA', 'TCA', 'TCG', 'TCT', 'TGA', 'TGC', 'TTA', 'TTG'],
//     ['ACT', 'AGA', 'AGG', 'AGT', 'CAA', 'CCT', 'GAC', 'GCA', 'GCC', 'GGC', 'GTC', 'TAA', 'TCA', 'TCT', 'TGA', 'TGC', 'TTA', 'TTG'],
//     ['ACT', 'AGG', 'AGT', 'ATC', 'CAA', 'CCT', 'GAA', 'GAC', 'GAT', 'GCA', 'GCC', 'GGC', 'GTC', 'TAA', 'TGC', 'TTA', 'TTC', 'TTG'],
//     ['ACT', 'AGG', 'AGT', 'CAA', 'CCT', 'GAA', 'GAC', 'GCA', 'GCC', 'GGC', 'GTC', 'TAA', 'TCA', 'TGA', 'TGC', 'TTA', 'TTC', 'TTG']
// ]

// console.log('start')
// console.log(codesToCheck.map(x => [isCircular(x), isC3(x)]))

// 0: true, false
// 1: true, false
// 2: true, false
// 3: true, false
// 4: true, true
// 5: true, false
// 6: true, true
// 7: true, false
// 8: true, false
// 9: true, false
// 10: true, true
// 11: true, false
// 12: true, true
// 13: true, false
// 14: true, false
// 15: true, false
// 16: true, false
// 17: true, false
// 18: true, false
// 19: true, false
// 20: true, false
// 21: true, false
// 22: true, true
// 23: true, true
// 24: true, false
// 25: true, true
// 26: true, false
// 27: true, false
// 28: true, true
// 29: true, false
// 30: true, false
// 31: true, false


// Check the paper for things you could add
// Test the 18
// Prove the mechanism behind 18 codon codes
// write first draft for the tool