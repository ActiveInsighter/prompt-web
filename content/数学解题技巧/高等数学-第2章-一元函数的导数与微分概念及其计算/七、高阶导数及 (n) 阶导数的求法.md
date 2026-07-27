---
id: math-solving-gaodeng-shuxue-chapter-2-section-009
title: 七、高阶导数及 \(n\) 阶导数的求法
description: 高等数学第2章《一元函数的导数与微分概念及其计算》：七、高阶导数及 \(n\) 阶导数的求法。
language: zh-CN
role: reference
visibility: public
tags:
  - 数学解题技巧
  - 高等数学
  - 第2章
metadata:
  book: 高等数学
  chapter: 第2章
  chapter_title: 一元函数的导数与微分概念及其计算
  source_section: 七、高阶导数及 \(n\) 阶导数的求法
---

# 七、高阶导数及 \(n\) 阶导数的求法
对给定的函数 \(f(x)\)，通常可用逐阶求导法求出高阶导数。但对某些简单的函数 \(y=f(x)\)，可用以下方法求其 \(n\) 阶导数的表达式。

## （一）归纳法

先依次求出 \(y=f(x)\) 的前几阶导数的表达式，并由此观察出规律性（有时还需适当变形），写出 \(y^{(n)}\) 的公式，再用数学归纳法证明。

**例 2.15**　设函数 \(f(x)\) 有任意阶导数且

\[
f'(x)=f^2(x),
\]

求 \(f^{(n)}(x)\)（\(n>2\)）。

**分析**　将

\[
f'(x)=f^2(x)
\]

两边求导得

\[
f''(x)=2f(x)f'(x)=2f^3(x),
\]

再求导得

\[
f'''(x)=3!f^2(x)f'(x)=3!f^4(x).
\]

由此可归纳证明

\[
f^{(n)}(x)=n!f^{n+1}(x).
\]

## （二）利用简单的初等函数的 \(n\) 阶导数公式

用归纳法易导出下列函数的 \(n\) 阶导数公式：

1. 

   \[
   \left(e^{ax+b}\right)^{(n)}=a^n e^{ax+b}.
   \]

2. 

   \[
   [\sin(ax+b)]^{(n)}
   =a^n\sin\left(ax+b+\frac{n\pi}{2}\right).
   \]

3. 

   \[
   [\cos(ax+b)]^{(n)}
   =a^n\cos\left(ax+b+\frac{n\pi}{2}\right).
   \]

4. 

   \[
   [(ax+b)^\beta]^{(n)}
   =a^n\beta(\beta-1)\cdots(\beta-n+1)(ax+b)^{\beta-n}.
   \]

5. 

   \[
   \left(\frac{1}{ax+b}\right)^{(n)}
   =\frac{(-1)^n a^n n!}{(ax+b)^{n+1}}.
   \]

6. 

   \[
   [\ln(ax+b)]^{(n)}
   =\frac{(-1)^{n-1}a^n(n-1)!}{(ax+b)^n}.
   \]

特别地，

\[
(e^x)^{(n)}=e^x,
\]

\[
(\sin x)^{(n)}
=\sin\left(x+\frac{n\pi}{2}\right),
\]

\[
(\cos x)^{(n)}
=\cos\left(x+\frac{n\pi}{2}\right),
\]

\[
(x^\alpha)^{(n)}
=\alpha(\alpha-1)\cdots(\alpha-n+1)x^{\alpha-n},
\]

\[
(\ln x)^{(n)}
=\frac{(-1)^{n-1}(n-1)!}{x^n}.
\]

其中 \(a,b,\alpha,\beta\) 为常数，且 \(a\ne 0\)。

## （三）分解法

通过恒等变形，将要求 \(n\) 阶导数的函数分解成上述简单初等函数之和。常有以下情形。

**1. 有理函数与无理函数的分解**

**例 2.16**　求下列 \(y^{(n)}\)：

1. 

   \[
   y=\frac{x^n}{1+x}.
   \]

2. 

   \[
   y=\frac{1+x}{\sqrt{1-x}}.
   \]

**解**

1. 当 \(n\) 为奇数时，\(x^n+1\) 可被 \(x+1\) 整除，

   \[
   x^n+1=(x+1)(x^{n-1}-x^{n-2}+\cdots-x+1),
   \]

   因而

   \[
   \begin{aligned}
   y
   &=\frac{x^n+1-1}{1+x}\\
   &=\frac{(x+1)(x^{n-1}-x^{n-2}+\cdots-x+1)}{1+x}
   -\frac{1}{1+x}\\
   &=(x^{n-1}-x^{n-2}+\cdots-x+1)-\frac{1}{1+x}.
   \end{aligned}
   \]

   所以

   \[
   \begin{aligned}
   y^{(n)}
   &=0-\left(\frac{1}{1+x}\right)^{(n)}\\
   &=\frac{(-1)^{n+1}n!}{(1+x)^{n+1}}\\
   &=\frac{n!}{(1+x)^{n+1}}.
   \end{aligned}
   \]

   当 \(n\) 为偶数时，\(x^n\) 除以 \(x+1\) 得

   \[
   x^n=(x+1)(x^{n-1}-x^{n-2}+\cdots+x-1)+1,
   \]

   因而

   \[
   y
   =\frac{x^n}{x+1}
   =x^{n-1}-x^{n-2}+\cdots+x-1+\frac{1}{x+1},
   \]

   所以

   \[
   \begin{aligned}
   y^{(n)}
   &=0+(-1)^n\frac{n!}{(x+1)^{n+1}}\\
   &=\frac{n!}{(x+1)^{n+1}}.
   \end{aligned}
   \]

2. 由于

   \[
   y
   =\frac{2-(1-x)}{\sqrt{1-x}}
   =2(1-x)^{-\frac12}-(1-x)^{\frac12},
   \]

   于是

   \[
   \begin{aligned}
   y^{(n)}
   &=\left[2(1-x)^{-\frac12}\right]^{(n)}
   -\left[(1-x)^{\frac12}\right]^{(n)}\\
   &=2(-1)^n
   \left(-\frac12\right)
   \left(-\frac12-1\right)\cdots
   \left(-\frac12-n+1\right)
   (1-x)^{-\frac12-n}\\
   &\quad
   -(-1)^n\frac12
   \left(\frac12-1\right)\cdots
   \left(\frac12-n+1\right)
   (1-x)^{\frac12-n}\\
   &=\frac{(2n-1)!!}{2^{n-1}}(1-x)^{-\frac12-n}
   +\frac{(2n-3)!!}{2^n}(1-x)^{\frac12-n}.
   \end{aligned}
   \]

**2. 三角函数的分解（利用三角函数恒等式及有关公式）**

**例 2.17**　设

\[
y=\sin^4x,
\]

求 \(y^{(n)}\)。

**解**

\[
\begin{aligned}
y
&=\left(\frac{1-\cos 2x}{2}\right)^2\\
&=\frac14(1-2\cos 2x+\cos^2 2x)\\
&=\frac14-\frac12\cos 2x+\frac18(1+\cos 4x).
\end{aligned}
\]

所以

\[
\begin{aligned}
y^{(n)}
&=-\frac12\cdot 2^n
\cos\left(2x+\frac{n\pi}{2}\right)
+\frac18\cdot 4^n
\cos\left(4x+\frac{n\pi}{2}\right)\\
&=-2^{n-1}\cos\left(2x+\frac{n\pi}{2}\right)
+\frac12\cdot 4^{n-1}
\cos\left(4x+\frac{n\pi}{2}\right).
\end{aligned}
\]

## （四）用莱布尼兹法则求乘积的 \(n\) 阶导数

\[
[u(x)v(x)]^{(n)}
=
\sum_{k=0}^{n}C_n^k u^{(k)}(x)v^{(n-k)}(x),
\]

其中

\[
C_n^k=\frac{n!}{k!(n-k)!},
\qquad
u^{(0)}(x)=u(x),
\qquad
v^{(0)}(x)=v(x).
\]

**例 2.18**　设

\[
y=x^2e^{2x},
\]

求 \(y^{(n)}\)。

**解**　用莱布尼兹法则，并注意

\[
(x^2)^{(k)}=0
\qquad (k=3,4,\ldots),
\]

以及

\[
(e^{2x})^{(k)}=2^ke^{2x},
\]

得

\[
\begin{aligned}
y^{(n)}
&=\sum_{k=0}^{n}C_n^k(x^2)^{(k)}(e^{2x})^{(n-k)}\\
&=x^2(e^{2x})^{(n)}
+n(x^2)'(e^{2x})^{(n-1)}
+\frac{n(n-1)}{2}(x^2)''(e^{2x})^{(n-2)}\\
&=2^ne^{2x}
\left[x^2+nx+\frac14n(n-1)\right].
\end{aligned}
\]

## （五）由 \(f(x)\) 在 \(x=x_0\) 处的泰勒公式的系数或幂级数展开式的系数求 \(f^{(n)}(x_0)\)

详见后面的泰勒公式与级数部分。
