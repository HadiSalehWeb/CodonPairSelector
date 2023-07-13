# CodonPairSelector
Interactive app to test exclusion rules between codon pairs. Try it out here https://hadisalehweb.github.io/CodonPairSelector/
# How to use
In this app you slowly build a circular C3 code by selecting pairs of codons. On the left is a table of codon anti-codon pairs. Click on one of the pairs to include it in your code. Included pairs are highlighted in yellow.

After selecing one (or many) pairs, you will notice certain other pairs will get highlighted in blue. Those pairs are excluded, meaning no code from G_216 contains the pairs you included *and* and the excluded pair. In other words, the code made from the included pairs (the pairs you seleced, highlighted in yellow) and any excluded code (highlighted in blue) is not circular and C3.

On the right is a table containing all the codes from G_216. As you select codon anti-codon pairs, the codes *not* including those pairs are highlighted in blue, leaving the 'compliant' codes unhighlighted. In other words, the set of pairs you selected is a subset of every code that's not highlighted. You can click on a code to highlight its codon anti-codon pairs in the left table.

Click "reset" in the top right to start over.

The program determines which pairs to exclude by filtering the codes to only those that contain the pairs you've selected, and checking which yet unselected pairs never occur in those codes. By checking "circularity" in the top right, the program will instead run through every unselected pair, and test if the set of selected pairs and this new pair are circular or not with an algorithm. If the resulting code is not circular the new pair is excluded. Note that as the number of selected pairs increases this algorithm becomes more expensive the program will run slower. In effect this option differs from the default in that it doesn't test for the C3 property.

__Color coding__: The codon anti-codon pairs are colored by the patterns of the nucleotides they contain. Each class of pairs shares some exclusion properties. The classes are:
- Orange: codons in the form Nc(N)N. They never occur in a circular code as the anticodon is the shifted version of the codon, meaning no code containing both can be circular.
- Yellow: codons in the form NNc(N) or Nc(N)c(N).
- Green: codons in the form N1N2c(N1) where N1 is strong and N2 is weak or vice versa.
- Purple: codons in the form N1c(N1)N2 or N2N1c(N1) where N1 is strong and N2 is weak or vice versa.
- White: codons in the form N1N1N2 or N1N2N1 or N2N1N1 where N1 is strong and N2 is weak or vice versa.