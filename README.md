# CodonPairSelector
Interactive website to test exclusion rules between codons. Try it out here https://hadisalehweb.github.io/CodonPairSelector/
# How to use
In this program you prgressively build a comma-free/circular/C3 code by selecting codons. On the left is a table of codons, click on one to include it in your code. Included codons are highlighted in yellow. Clicking again removes it from your code.

After selecing one (or many) codons, you will notice certain other codons will get highlighted in blue. Those codons are excluded, meaning no comma-free/circular/C3 code contains the codons you included *and* and the excluded codon. In other words, the code made from the included codons (the codons you seleced, highlighted in yellow) and any excluded codon (highlighted in blue) is not comma-free/circular/C3.

On the right is a table containing all maximal self complimentary codes of your selected type (comma-free/circular/C3). As you select codons, the codes *not* including those codons are highlighted in blue, leaving the 'compliant' codes unhighlighted. In other words, the set of codons you selected is a subset of every code that's not highlighted. You can click on a code to highlight all its codons in the left table.

Click "reset" in the top left to start over.

### Color coding
The codons are colored by the patterns of the nucleotides they contain. Each class of codons shares some exclusion properties. The classes are:
- Orange: codons in the form Nc(N)N. They never occur in a self complimentary code as the anticodon is the shifted version of the codon, meaning no code containing both can be circular or comma free. They do however occur non-self-complimentary codes.
- Yellow: codons in the form NNc(N) or Nc(N)c(N).
- Green: codons in the form N1N2c(N1) where N1 is strong and N2 is weak or vice versa.
- Purple: codons in the form N1c(N1)N2 or N2N1c(N1) where N1 is strong and N2 is weak or vice versa.
- Red: codons in the form N1N1N2 or N2N1N1 where N1 is strong and N2 is weak or vice versa.
- White: codons in the form N1N2N1 where N1 is strong and N2 is weak or vice versa.


### Options:
- Help: redirects to this page.
- Reset: deselects all codons, starting the process over.
- Copy current code to clipboard: copies the selected codons to clipboard as a comma-separated list.
- Import code: prompts the user to type in a list of comma-separated codons and selects those in the tool.
- Export table: downloads a json file of the entire right-side table for using as data or checking the codons in every code.
- Type: what kind of trinucleotide code is being tested for (comma-free, circular or C3).
- Self-complimentarity: whether or not to test for self-complimentarity.
- Maximality: whether or not to test for maximality (codon will be excluded if they resulting code can not be extended to be maximal).
- \# of codes: shows the number of maximal self-complimentary codes compliant with the currently selected codons.