# CodonPairSelector
Interactive website to test exclusion rules between codon pairs. Try it out here https://hadisalehweb.github.io/CodonPairSelector/
# How to use
In this program you slowly build a circular (C3) code by selecting pairs of codons. On the left is a table of codon anti-codon pairs. Click on one of the pairs to include it in your code. Included pairs are highlighted in yellow. Clicking again removes it from your code.

After selecing one (or many) pairs, you will notice certain other pairs will get highlighted in blue. Those pairs are excluded, meaning no code from G_216 contains the pairs you included *and* and the excluded pair. In other words, the code made from the included pairs (the pairs you seleced, highlighted in yellow) and any excluded code (highlighted in blue) is not circular (and C3).

On the right is a table containing all the codes from G_216. As you select codon anti-codon pairs, the codes *not* including those pairs are highlighted in blue, leaving the 'compliant' codes unhighlighted. In other words, the set of pairs you selected is a subset of every code that's not highlighted. You can click on a code to highlight its codon anti-codon pairs in the left table.

Click "reset" in the top right to start over.

The program determines which pairs to exclude by filtering the codes to only those that contain the pairs you've selected, and checking which yet unselected pairs never occur in those codes. By changing "Test by" to "Algorithm" in the top right, the program will instead run through every unselected pair, and test if the set of selected pairs and this new pair are circular (and C3) or not with a brute force algorithm. If the resulting code is not circular the new pair is excluded. Note that as the number of selected pairs increases this algorithm becomes more expensive and the program will run slower, especially if checking for C3 as well. In effect this option differs from the default filtering/matching method in that it doesn't check for maximality.

### Color coding
The codon anti-codon pairs are colored by the patterns of the nucleotides they contain. Each class of pairs shares some exclusion properties. The classes are:
- Orange: codons in the form Nc(N)N. They never occur in a circular code as the anticodon is the shifted version of the codon, meaning no code containing both can be circular.
- Yellow: codons in the form NNc(N) or Nc(N)c(N).
- Green: codons in the form N1N2c(N1) where N1 is strong and N2 is weak or vice versa.
- Purple: codons in the form N1c(N1)N2 or N2N1c(N1) where N1 is strong and N2 is weak or vice versa.
- White: codons in the form N1N1N2 or N1N2N1 or N2N1N1 where N1 is strong and N2 is weak or vice versa.


### Options:
- Help: redirects to this page.
- Reset: deselects all pairs, starting the process over.
- Table: choose which table to show on the right hand side, either the 216 maximal self-compimentary circular __C3__ codes, or the 528 maximal self-compimentary circular __non-C3__ codes.
- Test for: the testing codition for excluding pairs. You can either test for __circularity__ or __circularity and C3__.
- Test by: method of testing. __Matching__ checks if the "Test for" codition is true for a code by comparing the code you're building to every other code in the table, which in effect also tests for maximality (pairs that contribute to circular C3 but non-maximal codes are therefore excluded when this option is selected). __Algorithm__ tests using a brute force algorithm, without any reference to the table. Choosing Algorithm ignores the maximality condition.
- \# of codes: shows the number of codes compliant with the currently selected codon pairs.