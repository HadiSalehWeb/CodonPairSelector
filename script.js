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

    let lastAnimationCall = null
    const prompt = document.getElementById('prompt')
    const animatePrompt = function () {
        if (lastAnimationCall !== null)
            clearTimeout(lastAnimationCall)
        prompt.style.top = '22px'
        lastAnimationCall = setTimeout(() => prompt.style.top = '-50px', 2000)
    }
    const codonsToVector = function (codonsStr) {
        if (codonsStr == null) return
        const codons = codonsStr.split(',').map(x => x.trim().toUpperCase())
        return Array(10).fill(0).map(_ => Array(6).fill(0)).map((row, i) => row.map((_, j) => codons.includes(standardOrder[i][j])))
    }

    const transformations = ["I", "c", "p", "r", "PI_CG", "PI_AT", "PI_ACTG", "PI_AGTC"]

    const guiState = {
        "Help": () => window.open('https://github.com/HadiSalehWeb/CodonPairSelector', '_blank'),
        "Reset": () => setState(Array(10).fill(0).map(_ => Array(6).fill(false))),
        "Copy current code to clipboard": () => {
            navigator.clipboard.writeText(state.included.flatMap((row, i) => row.map((x, j) => x == false ? '' : standardOrder[i][j])).filter(Boolean).join(', '))
            animatePrompt()
        },
        "Import code": () => setState(codonsToVector(window.prompt("Enter a list of codons separated by commas e.g. ATC, CTT, GAC"))),
        "Export table": () => {
            const table = tables[currentSymbol()]
            const dlAnchorElem = document.getElementById('downloadAnchorElem')
            dlAnchorElem.setAttribute("href", "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vectors[currentSymbol()].map((code, n) => ({
                label: n + 1,
                equivalenceClass: table.find(row => row.some(x => x.id === n)).find(item => item != null && item.id === n).row + 1,
                transformation: transformations[table.find(row => row.some(x => x.id === n)).find(item => item != null && item.id === n).column],
                codons: code.flatMap((row, i) => row.map((x, j) => x === 0 ? null : standardOrder[i][j])).filter(x => x !== null),
            })), null, "\t")))
            dlAnchorElem.setAttribute("download", currentSymbol() + ".json")
            dlAnchorElem.click()
        },
        // "Table": "Comma-free", // "Circular", "C3"
        "Type": "Comma-free", // "Circular", "C3"
        "Self-complimentarity": "Ignore", // "Ignore"
        "Maximality": "Ignore", // "Ignore"
        "# of codes: ": 0
    }

    const gui = new dat.GUI()
    gui.add(guiState, 'Help')
    gui.add(guiState, 'Reset')
    gui.add(guiState, 'Copy current code to clipboard')
    gui.add(guiState, 'Import code')
    gui.add(guiState, 'Export table')
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

const isICircular = function (codons) {
    return isAcyclicStar(labeledCodeGraph(codons))
}

const codeGraph = function (codons) {
    return [distinct(codons.flatMap(x => [x[0], x[2], x[0] + x[1], x[1] + x[2]])), codons.flatMap(x => [[x[0], x[1] + x[2]], [x[0] + x[1], x[2]]])]
}

const labeledCodeGraph = function (codons) {
    return [distinct(codons.flatMap(x => [x[0], x[2], x[0] + x[1], x[1] + x[2]])), codons.flatMap(x => [[x[0], x[1] + x[2]], [x[0] + x[1], x[2]]]).map(x => ({ edge: x, aminoAcid: aminoAcid(x[0] + x[1]) }))]
}

const aminoAcid = function (codon) {
    return codon[0] == 'T' ?
        codon[1] == 'C' ? 'Ser' :
            codon[1] == 'T' ?
                codon[2] == 'T' || codon[2] == 'C' ? 'Phe' :
                    'Leu' :
                codon[1] == 'A' ?
                    codon[2] == 'T' || codon[2] == 'C' ? 'Tyr' :
                        'STOP' :
                    codon[2] == 'A' ? 'STOP' :
                        codon[2] == 'G' ? 'Trp' :
                            'Cys' :
        codon[0] == 'C' ?
            codon[1] == 'T' ? 'Leu' :
                codon[1] == 'C' ? 'Pro' :
                    codon[1] == 'G' ? 'Arg' :
                        codon[2] == 'T' || codon[2] == 'C' ? 'His' :
                            'Gln' :
            codon[0] == 'A' ?
                codon[1] == 'T' ?
                    codon[2] == 'G' ? 'Met' :
                        'Ile' :
                    codon[1] == 'C' ? 'Thr' :
                        codon[1] == 'A' ?
                            codon[2] == 'T' || codon[2] == 'C' ? 'Asn' :
                                'Lys' :
                            codon[2] == 'T' || codon[2] == 'C' ? 'Ser' :
                                'Arg' :
                codon[1] == 'T' ? 'Val' :
                    codon[1] == 'C' ? 'Ala' :
                        codon[1] == 'G' ? 'Gly' :
                            codon[2] == 'T' || codon[2] == 'C' ? 'Asp' :
                                'Glu';
}

const isAcyclic = function ([verts, edges]) {
    const outgoing = verts.filter(v => !edges.some(l => l[1] === v))
    if (outgoing.length === 0) return false;
    const visited = []
    return outgoing.every(x => isCycleFree([verts, edges], [x], visited)) && verts.every(v => visited.includes(v))
}

const isAcyclicStar = function ([verts, edges]) {
    const visited = []
    const cycles = []
    while (verts.some(v => !visited.includes(v)))
        findCycles([verts, edges], [verts.filter(v => !visited.includes(v))[0]], visited, cycles)
    return cycles.every(c => sharesAminoAcids(c, edges))
}

const findCycles = function ([verts, edges], path, visited, cycles) {
    const current = path[path.length - 1]
    visited.push(current)
    const outgoing = edges.filter(e => e.edge[0] === current).map(x => x.edge[1])
    const outgoingFiltered = []
    for (let v of outgoing)
        if (path.includes(v))
            cycles.push(path.slice(path.indexOf(v)))
        else outgoingFiltered.push(v)
    for (let v of outgoingFiltered)
        findCycles([verts, edges], path.concat(v), visited, cycles)
    return cycles
}

const isCycleFree = function ([verts, edges], list, processed) {
    if (!processed.includes(list[list.length - 1])) processed.push(list[list.length - 1])
    const nextNodes = edges.filter(x => x[0] === list[list.length - 1]).map(x => x[1])
    if (nextNodes.length === 0) return true
    if (nextNodes.some(x => list.includes(x))) return false
    return nextNodes.every(x => isCycleFree([verts, edges], list.concat(x), processed))
}

const sharesAminoAcids = function (list, edges) {
    return distinct(list.map((x, i) => edges.filter(y => y.edge[0] === x && y.edge[1] === list[i === list.length - 1 ? 0 : i + 1])[0].aminoAcid)).length === 1
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
const except = (arr, ex) => arr.filter(x => !ex.includes(x))



// const nucleotides = ['A', 'T', 'C', 'G']
// const allCodons = nucleotides.flatMap(x => nucleotides.flatMap(y => nucleotides.flatMap(z => x + y + z)))
// const table = allCodons.map(x => ({ codon: x, aminoAcid: aminoAcid(x) }))
// const aminoMap = table.reduce((a, c) => {
//     const found = a.filter(x => x.aminoAcid === c.aminoAcid)
//     if (found.length === 0)
//         return a.concat({ aminoAcid: c.aminoAcid, codons: [c.codon] })
//     found[0].codons.push(c.codon)
//     return a
// }, [])
// const aminoAcidList = distinct(table.map(x => x.aminoAcid).filter(x => x !== 'STOP'))
// const getNucs = amino => aminoMap.filter(x => x.aminoAcid === amino)[0].codons

// const chains = combinations(aminoAcidList)(3).map(x => ['STOP', ...x])
// const codonChains = chains.map(chain => ({ chain, nucs: getNucs(chain[0]).flatMap(n0 => getNucs(chain[1]).flatMap(n1 => getNucs(chain[2]).flatMap(n2 => getNucs(chain[3]).map(n3 => [n0, n1, n2, n3])))) }))
// const result = codonChains
//     .map(x => ({ chain: x.chain, nucs: x.nucs.map(y => ({ list: y, isCommaFree: isCommaFree(y), isCircular: isCircular(y), isICircular: isICircular(y) })) }))
//     .map(x => ({ chain: x.chain, nucs: x.nucs, sum: x.nucs.length, CF: x.nucs.filter(y => y.isCommaFree).length, C: x.nucs.filter(y => y.isCircular).length, IC: x.nucs.filter(y => y.isICircular).length, }))

// console.log(result)

// const aggregate = {
//     sum: result.reduce((a, c) => a + c.sum, 0),
//     iCircular: result.reduce((a, c) => a + c.IC, 0),
//     circular: result.reduce((a, c) => a + c.C, 0),
//     commaFree: result.reduce((a, c) => a + c.CF, 0)
// }

// aggregate.iCircularRatio = aggregate.iCircular / aggregate.sum
// aggregate.circularRatio = aggregate.circular / aggregate.sum
// aggregate.commaFreeRatio = aggregate.commaFree / aggregate.sum

// // console.log(aggregate)

// let text = ''

// text += 'Aggregate: \n'
// text += `Sum: ${aggregate.sum}\n`
// text += `I-Circular: ${aggregate.iCircular}\n`
// text += `Ratio: ${aggregate.iCircularRatio}\n`
// text += `Circular: ${aggregate.circular}\n`
// text += `Ratio: ${aggregate.circularRatio}\n`
// text += `Comma-free: ${aggregate.commaFree}\n`
// text += `Ratio: ${aggregate.commaFreeRatio}\n`

// text += '\n\n\n'

// text += result.reduce((a, c) => a + `Amino acids: [${c.chain.join(' ,')}]. I-Circular: ${c.IC}. Circular: ${c.C}. Comma-free: ${c.CF}. Codes:\n${c.nucs.map(nuc => ('[' + nuc.list.join(' ,') + ']') + (nuc.isCommaFree ? ' (comma free)' : nuc.isCircular ? ' (circular)' : nuc.isICircular ? ' (i-circular)' : '')).join('\n')}\n\n`, '')

// console.log(text)









// reverse function
// why are some codes non maximal? which combinations of condons make it so?
// text for: current code is comma free/circular/c3/maximal/self complimentary



// Check the paper for things you could add (16 and 96 dimaximal codes)
// X Test the 18
// Prove the mechanism behind 18 codon codes
// mention that anticodons are sometimes but not always invlolved in the three pair exclusion rules
// list the codons of the counterexample C3 non-maximal code you found
// X check if the 8 non-maximal C3 codes are transformations of each other
// X run the L transformations on all 32 non maximal codes
// why are there only 216? Can you use the exclusion rules to find an upper limit?

// check the images
// how did you find the set in section 6?
// why do we only have 216?
// extend the code subset in section 6, which michel code is it?


// add which code is shown in the last screenshot
// correct the last section, only one of the code (29) is C3
// add date to file name