# ontology-publisher.js

This application lets you publish an ontology as an interactive document. Your document can contain multiple graphs which you design to communicate several specific aspects of your model, giving the reader multiple points of view.
The tool was inspired by [WebVOWL](https://github.com/VisualDataWeb/WebVOWL), but uses Angular.js for the user interface (instead of raw d3) and adds the many features:
* persistent pick & pin, zoom, and pan: The views will look similar when you re-open them, because the pinned node locations as well the zoom and pan settings as well as filters will be saved
* WebVOWL style visualization of individuals (as green hexagons) and indivitual-class relations (*"is of type"*)
* .ttl file import (no need for a separate program to convert the ontology into a viewable format)
* a concept browser
* some basic reasoning functionality (inference of inverses, inferable transitive relations) to make the resulting ontology document more complete and useful

The application is webpacked into a static web application and requires no server to run but can be run directly from the filesystem. By zipping the static content you can provide it to anybody who can then view your ontology without installing any development tools.

This application does **not** aim to be a modelling tool, therefore you can't change the ontology itself (use a tool such as Prot�g� for this purpose). It is meant to produce a browsable, viewable document to get feedback on your model from users and domain experts.

## Setup and start
* clone the repository
* `npm install`
* `npm run build:dev`
* navigate your browser to `file://...../static/index.html` (tested with Chrome only)

## Getting started using the ontology publisher
* switch to the "Admin" tab
* import an ontology:

   Select a .ttl file to upload under "Load ontology file"  
   Enter a name for the ontology and press "Import"  
   (For a start, you can use the test ontology family from `src/rdflibutil/test_family.tt`)
* press "New View", and you will be switched to a new graphical view
* enter a name for your view and press "Save"
* now you can modify the view to your liking (move nodes around, filter out instances, classes, relationships) - don't forget to save!
* you can add more named views for the same ontology, as needed
* the ontology and all your views will be saved in browser local storage, and will therefore be available when you open the page again later
* you can download the complete data from your local storage containing all your ontologies and views as follows:

  Press "Prepare" under "Download Document"  
  Click on the "Download" link and save the file to your disk

  You can upload the resulting document later, or share it with somebody else so they can look at your ontology and the views.

## Screensots
![Concepts](https://raw.githubusercontent.com/m-emm/ontology-publisher.js/master/doc/img/Concepts.png "Concepts")
![Individuals](https://raw.githubusercontent.com/m-emm/ontology-publisher.js/master/doc/img/Individuals.png "Individuals")
![Concept Browser](https://raw.githubusercontent.com/m-emm/ontology-publisher.js/master/doc/img/ConceptBrowser.png "Concept Browser")
![Admin](https://raw.githubusercontent.com/m-emm/ontology-publisher.js/master/doc/img/Admin2.png "Admin")

## Acknowledgements
* Thanks to the [rdflib.js](https://github.com/linkeddata/rdflib.js) team for their library which lets me directly import ontologies
* Many thanks to the WebVOWL team who have created the amazing [WebVOWL](https://github.com/VisualDataWeb/WebVOWL), on which this project is heavily based. I have included the full source code of WebVOWL here, because I had to tweak it somewhat to make it work.

## Useful links
* [Web Ontology Language on Wikipedia](https://en.wikipedia.org/wiki/Web_Ontology_Language)
* [Protege](http://protege.stanford.edu/) ontology editor
