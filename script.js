fetch('data/vectors.json')
    .then(response => response.json())
    .then(vectors => {
        fetch('data/list.json')
            .then(response => response.json())
            .then(list => {
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
                // const c = x => x === 'A' ? 'T' : x === 'T' ? 'A' : x === 'C' ? 'G' : 'C'
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
                    var row = c[0] - 1, column = c[1]
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

                const state = {
                    circularity: false,
                    allowExcludedSelection: true,
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
                    reset: () => setState(Array(10).fill(-1)),
                    help: () => window.open('https://github.com/HadiSalehWeb/CodonPairSelector', '_blank') 
                }

                const toggle = function (row, pair) {
                    if (!state.allowExcludedSelection && state.excluded[row][pair]) return
                    state.included[row] = state.included[row] === pair ? -1 : pair

                    if (state.circularity) {
                        const includedCodons = state.included.reduce((a, c, i) => c === -1 ? a : a.concat(standardOrder[i][c]), [])
                        state.excluded = standardOrder.map((row, i) =>
                            state.included[i] !== -1 ? [true, true, true] :
                                row.map(x => !isCircular(x.concat(includedCodons).map(c => letterToNumber(c))))
                        )
                    }
                    else {
                        state.excluded = vectors
                            .filter(vector => vector.every((elem, i) => state.included[i] === -1 || state.included[i] === elem))
                            .reduce((a, c) => (c.map((x, i) => a[i].includes(x) ? a[i] : a[i].push(x)), a), Array(10).fill(0).map(_ => []))
                            .map(x => x.sort())
                            .map(x => [!x.includes(0), !x.includes(1), !x.includes(2)])
                    }

                    update()
                }

                const setState = function (vector) {
                    state.included = vector

                    state.excluded = vectors
                        .filter(vector => vector.every((elem, i) => state.included[i] === -1 || state.included[i] === elem))
                        .reduce((a, c) => (c.map((x, i) => a[i].includes(x) ? a[i] : a[i].push(x)), a), Array(10).fill(0).map(_ => []))
                        .map(x => x.sort())
                        .map(x => [!x.includes(0), !x.includes(1), !x.includes(2)])

                    update()
                }

                const codonTableContainer = document.getElementById('codon-table')
                const codesTableContainer = document.getElementById('codes-table')

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
                    [...codesTableContainer.children[0].children[1].children].forEach(row =>
                        [...row.children].slice(1).forEach(elem =>
                            isCompliant(vectors[+elem.getAttribute('data-id')]) ? elem.classList.remove('excluded') : elem.classList.add('excluded')
                        )
                    )
                }

                const gui = new dat.GUI()
                gui.add(state, 'help')
                gui.add(state, 'reset')
                gui.add(state, 'circularity').onChange(x => setState(state.included))

                build()
                update()
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