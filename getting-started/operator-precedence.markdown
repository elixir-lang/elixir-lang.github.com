---
layout: getting-started
title: Operators Precedence
---

# {{ page.title }}

{% include toc.html %}

An operator represents an operation to be performed on one or more operands.
The operator table below is ordered with the highest precedence operator at the top.

Precedence | Operator | Associativity
:--------: | -------- | -------------
 1  | `@` | Non-assoc.
 2  | `.` (Both Dot and Dot Call) | Left to right
 3  | `+` `-` `!` `^` `not` `~~~` | Non-assoc.
 4  | `^` `(^^^)` | Left to right
 5  | `*` `/` | Left to right
 6  | `+` `-` | Left to right
 7  | `++` `--` `..` `<>` | Right to left
 8  | `in` | Left to right
 9  | `< (op)` `> (op)` <code>&#124;></code> `<<<` `>>>` `~>>` `<<~` `~>` `<~` `<~>` <code><&#124;></code> | Left to right
 10 | `<` `>` `<=` `>=` | Left to right
 11 | `==` `!=` `=~` `===` `!==` | Left to right
 12 | `&&` `&&&` `and` | Left to right
 13 | <code>&#124;&#124;</code> <code>&#124;&#124;&#124;</code> `or` | Left to right
 14 | `=` | Right to left
 15 | `=>` | Right to left
 16 | <code>&#124;</code> | Right to left
 17 | `::` | Right to left
 18 | `when` | Right to left
 19 | `<-` `\\` (allowed in matches along =) | Left to right
 20 | `&` | Non-assoc.
 21 | `,` | Left to right
 22 | `->` | Right to left
 23 | `do` | Left to right
