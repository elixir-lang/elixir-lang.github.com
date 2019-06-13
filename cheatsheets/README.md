this directory contains tex source files and their corresponding
pdf files, containing small help pages, reminders, compressed
references, also called cheat sheets.

to produce a pdf starting from the tex source, you need tex, and
more specifically LaTeX. 

links for installation:
- https://www.latex-project.org/get/

if you do not manage to compile the source into a pdf, or if you
manage only after taking additional steps, not mentioned here,
please add the steps in this description.

basically, to compile a tex file EQUIS.tex into its corresponding
EQUIS.pdf, you do:

texi2pdf EQUIS.tex

and you ignore all output except the very last two lines, which
should look like:

Output written on EQUIS.pdf (2 pages, 69846 bytes).
Transcript written on EQUIS.log.
