This directory contains TeX source files and their corresponding
PDF files, containing small help pages, reminders, compressed
references, also called cheat sheets.

To produce a .pdf starting from the .tex source, you need `tex`,
and more specifically [LaTeX](https://www.latex-project.org/get/).

The BasicTex variant can be used as long as the following packages
are available:

    $ tlmgr install courier framed charter enumitem ec helvetica

To compile a tex file EQUIS.tex into its corresponding EQUIS.pdf:

    $ texi2pdf EQUIS.tex

You may ignore all output except the very last two lines, which
should look like:

    Output written on EQUIS.pdf (2 pages, 69846 bytes).
    Transcript written on EQUIS.log.
