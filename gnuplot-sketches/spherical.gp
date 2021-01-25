#!/usr/local/bin/gnuplot -persist
#
#
#    	G N U P L O T
#    	Version 5.4 patchlevel 1    last modified 2020-12-01
#
#    	Copyright (C) 1986-1993, 1998, 2004, 2007-2020
#    	Thomas Williams, Colin Kelley and many others
#
#    	gnuplot home:     http://www.gnuplot.info
#    	faq, bugs, etc:   type "help FAQ"
#    	immediate help:   type "help"  (plot window: hit 'h')
# set terminal x11
# set output

set border 0
unset key
unset xtics
unset ytics
unset ztics
set size .5,1.0
set isosample 60,60
set hidden3d

set parametric
set urange [0:pi]
set vrange [0:2*pi]
set isosample 36,36
set ticslevel 0
# set size 0.65,1.0

Y(u,v)=0.25*sqrt(105/2*pi)*cos(2*v)*sin(u)**2*cos(u)
Fx(u,v)=sin(u)*cos(v)*abs(Y(u,v))
Fy(u,v)=sin(u)*sin(v)*abs(Y(u,v))
Fz(u,v)=cos(u)*abs(Y(u,v))

splot Fx(u,v),Fy(u,v),Fz(u,v)