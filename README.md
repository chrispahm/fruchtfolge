# MOVED - THIS REPOSITORY IS DEPRECATED
Development of this project continues at [https://github.com/fruchtfolge/client](https://github.com/fruchtfolge/client)


# Fruchtfolge

Fruchtfolge (german for crop rotation) is a web app project aimed at identifying optimal crop production plans for farmers, maximising their potential income. It is currently under development.

:tada: Happy to annouce a first working beta running at [https://v-server-node.ilb.uni-bonn.de](https://v-server-node.ilb.uni-bonn.de)!

## Idea

In agricultural sciences, farm scale models are intesively used for policy analysis (eg. [Jansen et al. (2010)](https://link.springer.com/article/10.1007/s00267-010-9588-x) and [Louhichi et al. (2012)](http://www.sciencedirect.com/science/article/pii/S0308521X1000082X) among others). However, despite their potential use as an income maximising management support tool, they are rarely used in agricultural practice (as illustrated by [Musshoff and Hirschauer (2016), p. 216f.](https://books.google.de/books?id=J6q3DAAAQBAJ&pg=PA59&dq=Modernes+Agrarmanagement:+Betriebswirtschaftliche+Analyse-+und+Planungsverfahren+bokelmann&hl=de&sa=X&ved=0ahUKEwiT97mkutvUAhWmQpoKHUqjA4wQ6AEIJzAA#v=onepage&q&f=false)).
"Fruchtfolge" aims at overcoming two key issues in practical implemenations of farm scale models identified by the aformentioned authors through
a) reducing the effort needed in order to acquire adequate farm planning data
b) providing a sufficient adaptation towards the individual farm endowments within a short amount of time.

The overall goal is to create an individual, optimised crop production plan within less than 10 minutes.
A research paper discussing the methodology can be found [here](https://uni-bonn.sciebo.de/index.php/s/99SIXQb6lsNZ0Es).

## Features

In order to overcome the aforementioned issues, Linked Open Data is used wherever possible in order to reduce the model setup time requirements.

- Plot names, shapes and previous crops are taken from the EU direct payment application forms (solely for the state of Northrhine-Westphalia for now, see parseElanGml and parseElanXml)
- Soil quality, type and plot-to-farm distances per plot are taken from [BGR](https://www.bgr.bund.de/DE/Home/homepage_node.html;jsessionid=4FD5CBFD0BC5D16ACE35AED6536FFDD4.2_cid284) and [OSM](https://www.openstreetmap.de/)
- Crop rotation recommendations taken from the chamber of agriculture of Northrhine-Westphalia 
- Standard cultivation procedures per crop (used for individual variable crops per plot/crop) taken from [KTBL](http://www.ktbl.de/)
- Standard gross margins are taken from [KTBL](http://daten.ktbl.de/sdb/welcome.do)

From the data input, a linear farm model is automatically set up. Farmers may specifiy constraints regarding maximum and minimum crop shares. In the model, the optimal crop allocation per plot is then determined. For 20 plots and less, the model is solved ad-hoc on the users machine, while larger models are first translated into a [GAMS](https://www.gams.com/) model and solved using the [NEOS-Server](https://neos-server.org/neos/).

## Libraries used

The web app is written in Javascript and HTML, and uses the following libraries
- [Mapbox GL JS](https://github.com/mapbox/mapbox-gl-js)
- [Mapbox GL Draw](https://github.com/mapbox/mapbox-gl-draw)
- [Turf JS](https://github.com/Turfjs/turf)
- [proj4js](https://github.com/proj4js/proj4js)
- [PouchDB](https://github.com/pouchdb/pouchdb)
- [PouchDB-Auth](https://github.com/pouchdb/pouchdb-auth)
- [jsLPSolver](https://github.com/JWally/jsLPSolver)
- [ObjTree](https://github.com/rranauro/ObjTree)
- [spin.js](https://github.com/fgnass/spin.js)
- [Chart.js](https://github.com/chartjs/Chart.js)

## Contribution

Contribution is highly appreciated! 
Current ToDos:
  - Bug fixes
  - reduction of browser inconsistencies
  - speed improvements (especially loading time)

If you like to get in touch send a mail to christoph.pahmeyer@uni-bonn.de!

