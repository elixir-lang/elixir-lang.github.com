This directory contains TeX source files and their corresponding
PDF files, containing small help pages, reminders, compressed
references, also called cheat sheets.

To produce a .pdf starting from the .tex source, you need `tex`,
and more specifically [LaTeX](https://www.latex-project.org/get/).
The BasicTex variant is enough for the purpose of these sheets.

If you do not manage to compile the source into a pdf, or if you
manage only after taking additional steps, not mentioned here,
please add the steps in this description.

To compile a tex file EQUIS.tex into its corresponding EQUIS.pdf:

    $ texi2pdf EQUIS.tex

You may ignore all output except the very last two lines, which
should look like:

    Output written on EQUIS.pdf (2 pages, 69846 bytes).
    Transcript written on EQUIS.log.
