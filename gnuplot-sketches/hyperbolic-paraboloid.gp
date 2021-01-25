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
set size 1.0,1.0
set isosample 20,20
set hidden3d

set view 248, 36, 1, 1
splot [-2:2][-2:2] y**2 - x**2