fetch('data/vectors.json')
    .then(response => response.json())
    .then(vectors => {
        fetch('data/vectors-non-c3.json')
            .then(response => response.json())
            .then(vectorsNonC3 => {
                fetch('data/list.json')
                    .then(response => response.json())
                    .then(list => {
                        fetch('data/list-non-c3.json')
                            .then(response => response.json())
                            .then(listNonC3 => {
                                const standardOrder = [
                                    [['ATA', 'TAT'], ['TAA', 'TTA'], ['AAT', 'ATT']],
                                    [['CGC', 'GCG'], ['GCC', 'GGC'], ['CCG', 'CGG']],
                                    [['ACT', 'AGT'], ['CTA', 'TAG'], ['TAC', 'GTA']],
                                    [['TCA', 'TGA'], ['CAT', 'ATG'], ['ATC', 'GAT']],
                                    [['CAG', 'CTG'], ['AGC', 'GCT'], ['GCA', 'TGC']],
                                    [['GAC', 'GTC'], ['ACG', 'CGT'], ['CGA', 'TCG']],
                                    [['AAC', 'GTT'], ['ACA', 'TGT'], ['CAA', 'TTG']],
                                    [['ACC', 'GGT'], ['CCA', 'TGG'], ['CAC', 'GTG']],
                                    [['AAG', 'CTT'], ['AGA', 'TCT'], ['GAA', 'TTC']],
                                    [['AGG', 'CCT'], ['GGA', 'TCC'], ['GAG', 'CTC']]
                                ]
                                const types = [
                                    [0, 4, 4],
                                    [0, 4, 4],
                                    [3, 1, 1],
                                    [3, 1, 1],
                                    [3, 1, 1],
                                    [3, 1, 1],
                                    [2, 2, 2],
                                    [2, 2, 2],
                                    [2, 2, 2],
                                    [2, 2, 2],
                                ]
                                //https://paletton.com/#uid=73+1T0kiP5KlvrphycXml1Rs207
                                // const colors = {
                                //     background: '#101020',
                                //     included: '#DAB648',
                                //     excluded: '#424299',
                                //     type0: '#DA7248',
                                //     type1: '#8E2F8E',
                                //     type2: '#FFFFFF',
                                //     type3: '#31966B',
                                //     type4: '#BBD345'
                                // }

                                const codesTable = list.reduce((a, c, i) => {
                                    const row = c[0] - 1, column = c[1]
                                    if (!a[row]) a[row] = []
                                    a[row][column] = {
                                        id: i,
                                        label: i + 1,
                                        row,
                                        column,
                                        winner: c[2] === 1,
                                        loser: c[3] === 1
                                    }
                                    return a
                                }, [])

                                const nonC3CodesTable = listNonC3.reduce((a, c, i) => {
                                    const row = c[0] - 1, column = c[1], column2 = c[2]
                                    if (!a[row]) a[row] = []
                                    a[row][column] = {
                                        id: i,
                                        label: i + 1,
                                        row,
                                        column,
                                        isC3: c[3] === 1
                                    }
                                    if (column2 !== -1)
                                        a[row][column2] = {
                                            id: i,
                                            label: i + 1,
                                            row,
                                            column2,
                                            isC3: c[3] === 1
                                        }
                                    return a
                                }, [])

                                const state = {
                                    included: [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
                                    excluded: [
                                        [true, false, false],
                                        [true, false, false],
                                        [false, false, false],
                                        [false, false, false],
                                        [false, false, false],
                                        [false, false, false],
                                        [false, false, false],
                                        [false, false, false],
                                        [false, false, false],
                                        [false, false, false]
                                    ],
                                }

                                const toggle = function (row, pair) {
                                    // if (!guiState['Allow excluded selection'] && state.excluded[row][pair] && state.included[row] !== pair) return
                                    state.included[row] = state.included[row] === pair ? -1 : pair
                                    updateLogic()
                                }

                                const setState = function (vector) {
                                    state.included = vector
                                    updateLogic()
                                }

                                const updateLogic = function () {
                                    if (guiState['Maximality'] === 'Ignore maximality') {
                                        const includedCodons = state.included.reduce((a, c, i) => c === -1 ? a : a.concat(standardOrder[i][c]), [])
                                        state.excluded = standardOrder.map((row, i) =>
                                            state.included[i] !== -1 ? [true, true, true] :
                                                row.map(x => {
                                                    const code = x.concat(includedCodons)
                                                    return guiState["C3"] === 'Test for circularity only' ? !isCircular(code.map(c => letterToNumber(c))) :
                                                        !(isCircular(code.map(c => letterToNumber(c))) && isCircular(code.map(c => alpha1(letterToNumber(c)))) && isCircular(code.map(c => alpha2(letterToNumber(c)))))
                                                })
                                        )
                                    }
                                    else {
                                        state.excluded = (guiState['C3'] === 'Test for circularity only' ? vectorsNonC3 : vectors)
                                            .filter(vector => vector.every((elem, i) => state.included[i] === -1 || state.included[i] === elem))
                                            .reduce((a, c) => (c.map((x, i) => a[i].includes(x) ? a[i] : a[i].push(x)), a), Array(10).fill(0).map(_ => []))
                                            .map(x => x.sort())
                                            .map(x => [!x.includes(0), !x.includes(1), !x.includes(2)])
                                    }

                                    update()
                                }

                                const codonTableContainer = document.getElementById('codon-table')
                                const codesTableContainer = document.getElementById('codes-table')
                                const activeCodosTable = _ => guiState['Table'] === 'C3 codes' ? codesTableContainer.children[0] : codesTableContainer.children[1]

                                const build = function () {
                                    buildCodonTable()
                                    buildCodesTable()
                                }

                                const buildCodonTable = function () {
                                    const table = document.createElement('table')

                                    const thead = document.createElement('thead')
                                    thead.innerHTML = `<tr><th>1</th><th>2</th><th>3</th></tr>`
                                    table.appendChild(thead)

                                    const tbody = document.createElement('tbody')
                                    tbody.innerHTML = standardOrder.map((row, i) => `<tr>${row.map((elem, j) => `<td class='${'type' + types[i][j]}'>${elem[0]}, ${elem[1]}</td>`).join('')}</tr>`).join('');
                                    [...tbody.children].forEach(row => [...row.children].forEach(td => td.addEventListener('click', e =>
                                        toggle([...e.target.parentElement.parentElement.children].indexOf(e.target.parentElement), [...e.target.parentElement.children].indexOf(e.target))
                                    )))
                                    table.appendChild(tbody)

                                    codonTableContainer.appendChild(table)
                                }

                                const buildCodesTable = function () {
                                    const table = document.createElement('table')

                                    const thead = document.createElement('thead')
                                    thead.innerHTML = `<tr><th>#</th><th>I</th><th>c</th><th>p</th><th>r</th><th>PI_CG</th><th>PI_AT</th><th>PI_ACTG</th><th>PI_AGTC</th></tr>`
                                    table.appendChild(thead)

                                    const tbody = document.createElement('tbody')
                                    tbody.innerHTML = codesTable.map((row, i) => `<tr><td>${i + 1}</td>${row.map((elem, j) => `<td data-id="${elem.id}">${elem.label}</td>`).join('')}</tr>`).join('');
                                    [...tbody.children].forEach(row => [...row.children].slice(1).forEach(td => td.addEventListener('click', e =>
                                        setState(vectors[e.target.getAttribute('data-id')].slice(0))
                                    )))
                                    table.appendChild(tbody)

                                    codesTableContainer.appendChild(table)


                                    const table2 = document.createElement('table')

                                    const thead2 = document.createElement('thead')
                                    thead2.innerHTML = `<tr><th>#</th><th>I</th><th>c</th><th>p</th><th>r</th><th>PI_CG</th><th>PI_AT</th><th>PI_ACTG</th><th>PI_AGTC</th></tr>`
                                    table2.appendChild(thead2)

                                    const tbody2 = document.createElement('tbody')
                                    tbody2.innerHTML = nonC3CodesTable.map((row, i) => `<tr><td>${i + 1}</td>${row.map((elem, j) => `<td data-id="${elem.id}">${elem.label}</td>`).join('')}</tr>`).join('');
                                    [...tbody2.children].forEach(row => [...row.children].slice(1).forEach(td => td.addEventListener('click', e =>
                                        setState(vectorsNonC3[e.target.getAttribute('data-id')].slice(0))
                                    )))
                                    table2.appendChild(tbody2)

                                    codesTableContainer.appendChild(table2)
                                }

                                const getCodonElement = function (i, j) {
                                    return codonTableContainer.children[0].children[1].children[i].children[j]
                                }

                                const isCompliant = function (code) {
                                    return code.every((x, i) => state.included[i] === -1 || state.included[i] === x)
                                }

                                const update = function () {
                                    updateCodonTable()
                                    updateCodesTable()
                                }

                                const updateCodonTable = function () {
                                    state.excluded.forEach((exRow, rowIndex) => exRow.forEach((elem, elemIndex) => elem ? getCodonElement(rowIndex, elemIndex).classList.add('excluded') : getCodonElement(rowIndex, elemIndex).classList.remove('excluded')))
                                    state.included.forEach((column, row) => {
                                        [...getCodonElement(row, 0).parentElement.children].forEach((elem, i) => i === column ? elem.classList.add('included') : elem.classList.remove('included'))
                                    })
                                }

                                const updateCodesTable = function () {
                                    codesTableContainer.children[guiState['Table'] === 'C3 codes' ? 0 : 1].setAttribute('style', 'display: block')
                                    codesTableContainer.children[guiState['Table'] === 'C3 codes' ? 1 : 0].setAttribute('style', 'display: none');
                                    [...activeCodosTable().children[1].children].forEach(row =>
                                        [...row.children].slice(1).forEach(elem =>
                                            isCompliant((vectorsNonC3)[+elem.getAttribute('data-id')]) ? elem.classList.remove('excluded') : elem.classList.add('excluded')
                                        )
                                    )
                                    guiState['# of codes: '] = (guiState['Table'] === 'Circular codes' ? vectorsNonC3 : vectors).filter(vector => isCompliant(vector)).length
                                }

                                const guiState = {
                                    Help: () => window.open('https://github.com/HadiSalehWeb/CodonPairSelector', '_blank'),
                                    Reset: () => setState(Array(10).fill(-1)),
                                    Table: "C3 codes", // "Circular codes"
                                    "C3": "Test for C3", // "Test for circularity only"
                                    "Maximality": "Exclude codons from non-maximal codes.", // "Ignore maximality"
                                    // "Allow excluded selection": true,
                                    "# of codes: ": 216
                                }

                                const gui = new dat.GUI()
                                gui.add(guiState, 'Help')
                                gui.add(guiState, 'Reset')
                                gui.add(guiState, 'Table', ['C3 codes', 'Circular codes']).onChange(_ => setState(state.included))
                                gui.add(guiState, 'C3', ['Test for C3', 'Test for circularity only']).onChange(_ => setState(state.included))
                                gui.add(guiState, 'Maximality', ['Exclude codons from non-maximal codes.', 'Ignore maximality']).onChange(_ => setState(state.included))
                                // gui.add(guiState, 'Allow excluded selection').onChange(_ => setState(state.included))
                                const numDisplay = gui.add(guiState, '# of codes: ').listen()
                                numDisplay.domElement.style.pointerEvents = "none"
                                numDisplay.domElement.children[0].style.backgroundColor = "initial"

                                build()
                                update()
                            })
                    })
            })
    })

const letterToNumber = x => x.split('').map(x => ['A', 'C', 'T', 'G'].indexOf(x))

const isCircular = function (codons) {
    const variations = variationsR(codons)(4)
    for (let nucleotide of variations)
        if (countDecompositions(nucleotide.reduce((a, c) => a.concat(c), []), codons) >= 2)
            return false
    return true
}

const variationsR = arr => n => n <= 1 ? arr.map(x => [x]) : variationsR(arr)(n - 1).reduce((a, c) => a.concat(arr.map(x => c.concat([x]))), [])

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




// const c = x => x === 'A' ? 'T' : x === 'T' ? 'A' : x === 'C' ? 'G' : 'C'
// const codes = []
// const map = {
//     0: 'A',
//     1: 'T',
//     2: 'C',
//     3: 'G',
// }
// const myC = n => n === 0 ? a : n === 1 ? 0 : n === 2 ? 3 : 2
// for (let ix = 0; ix < 4; ix++)
//     for (let iy = 0; iy < 4; iy++)
//         for (let iz = 0; iz < 4; iz++)
//             for (let ia = 0; ia < 4; ia++)
//                 for (let ib = 0; ib < 4; ib++)
//                     for (let ic = 0; ic < 4; ic++) {
//                         if ((ia === ib && ib === ic) || (ia === ic && ia === myC(ib))) continue
//                         codes.push({
//                             assignment: {
//                                 X: ['A', 'C', 'T', 'G'].indexOf(map[ix]),
//                                 Y: ['A', 'C', 'T', 'G'].indexOf(map[iy]),
//                                 Z: ['A', 'C', 'T', 'G'].indexOf(map[iz]),
//                                 A: ['A', 'C', 'T', 'G'].indexOf(map[ia]),
//                                 B: ['A', 'C', 'T', 'G'].indexOf(map[ib]),
//                                 C: ['A', 'C', 'T', 'G'].indexOf(map[ic]),
//                                 Ap: ['A', 'C', 'T', 'G'].indexOf(c(map[ia])),
//                                 Bp: ['A', 'C', 'T', 'G'].indexOf(c(map[ib])),
//                                 Cp: ['A', 'C', 'T', 'G'].indexOf(c(map[ic])),

//                             },
//                             code: [
//                                 [map[ix], map[ia], map[ib]],
//                                 [map[iy], map[ib], map[ic]],
//                                 [map[iz], map[ic], map[ia]],
//                                 [c(map[ib]), c(map[ia]), c(map[ix])],
//                                 [c(map[ic]), c(map[ib]), c(map[iy])],
//                                 [c(map[ia]), c(map[ic]), c(map[iz])],
//                             ].map(codon => letterToNumber(codon.join('')))
//                         })
//                     }
// console.log(codes.map(x =>
//     isCircular(x.code) &&
//     !x.code.some(codon =>
//         (codon[0] === x.assignment.A && codon[1] === x.assignment.B && codon[2] === x.assignment.C) ||
//         (codon[0] === x.assignment.B && codon[1] === x.assignment.C && codon[2] === x.assignment.A) ||
//         (codon[0] === x.assignment.C && codon[1] === x.assignment.A && codon[2] === x.assignment.B) ||
//         (codon[0] === x.assignment.Cp && codon[1] === x.assignment.Bp && codon[2] === x.assignment.Ap) ||
//         (codon[0] === x.assignment.Ap && codon[1] === x.assignment.Cp && codon[2] === x.assignment.Bp) ||
//         (codon[0] === x.assignment.Bp && codon[1] === x.assignment.Ap && codon[2] === x.assignment.Cp)
//     )
// ))