# usage:
#   just exec this and then view results

# dependencies:
#   pandoc
#   nodejs
#   texlive

# author: Li, Yu (liyu1981@gmail.com)

SRC="../getting_started/mix_otp"
DST="mix_and_otp"
TOTAL_DOCS=10

DOCUMENT_SETTING="\documentclass{article}
\usepackage{minted}
\usepackage[bookmarks]{hyperref}
\hypersetup{pdftex,colorlinks=true,allcolors=blue}
\begin{document}
"
DOCUMENT_HEADER="
\title{Elixir: Mix and OTP}
\date{July 2014}
\author{Plataformatec}
\maketitle
"

rm -rf *.markdown
rm -rf *.tex
rm -rf texwd; mkdir -p texwd
rm -rf ${DST}.pdf

for i in `seq $TOTAL_DOCS`; do
  cat ${SRC}/$i.markdown >> all.markdown
done

node preprocess.js >new.markdown

pandoc new.markdown -o new.tex

echo "$DOCUMENT_SETTING" >>final.tex
echo "$DOCUMENT_HEADER" >>final.tex
cat new.tex >>final.tex
echo "\end{document}" >>final.tex

mv final.tex texwd/
cd texwd/

# somehow mix_otp needs some brutal hack :)
sed -i '23s/.*/\\begin{verbatim}/g' final.tex
sed -i '39s/.*/\\end{verbatim}/g' final.tex
sed -i 's/\/docs\/stable\/elixir\/Kernel\.html\\#\\textbar{}\\textgreater{}\/2/\/docs\/stable\/elixir\/Kernel\.html\\#|>\/2/g' final.tex

pdflatex -shell-escape final.tex
pdflatex -shell-escape final.tex # second time for the bookmarks
cd ..
cp texwd/final.pdf ${DST}.pdf
