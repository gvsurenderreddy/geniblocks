"use strict";

var mother = new BioLogica.Organism(BioLogica.Species.Drake, "a:m,b:M,a:h,b:h,a:C,b:C,a:a,b:a,a:B,b:B,a:D,b:D,a:w,b:W,a:Fl,b:Fl,a:Hl,b:hl,a:T,b:t,a:rh,b:rh,a:Bog,b:Bog", 1),
    father = new BioLogica.Organism(BioLogica.Species.Drake, "a:M,a:h,b:h,a:C,b:C,a:a,b:a,a:B,a:D,a:W,a:fl,b:fl,a:Hl,a:t,b:T,a:rh,a:Bog,b:Bog", 0),
    hiddenAlleles = ['h', 'c', 'a', 'b', 'd', 'bog', 'rh'],
    motherDisabledAlleles = [],
    fatherDisabledAlleles = [],
    showFilters = false,
    gameteCount = 72,
    animStiffness = 100,
    gametePoolWidth = 300,
    gametePoolHeight = 350,
    filteredGameteCount = 35,
    filteredGametePoolHeight = 200,
    motherGametes,
    fatherGametes,
    prevSelectedMotherGameteId,
    selectedMotherGameteId,
    selectedMotherGamete,
    selectedMotherGameteSrcRect,
    prevSelectedFatherGameteId,
    selectedFatherGameteId,
    selectedFatherGamete,
    selectedFatherGameteSrcRect,
    fertilizationState = 'none',
    // 'none' -> 'fertilizing' -> 'fertilized' -> 'complete' -> 'none'
offspring;

function parseQueryString(queryString) {
  var params = {},
      queries,
      temp,
      i,
      l;

  // Split into key/value pairs
  queries = queryString.split('&');

  // Convert the array of strings into an object
  for (i = 0, l = queries.length; i < l; i++) {
    temp = queries[i].split('=');
    params[temp[0]] = temp[1];
  }

  return params;
}

var urlParams = parseQueryString(window.location.search.substring(1));
if (urlParams.filter && (urlParams.filter.toLowerCase() === "true" || Boolean(Number(urlParams.filter)))) {
  showFilters = true;
  gametePoolHeight = filteredGametePoolHeight;
  gameteCount = filteredGameteCount;
}
if (urlParams.count > 0) gameteCount = Number(urlParams.count);
if (urlParams.speed > 0) animStiffness = Number(urlParams.speed);

motherGametes = mother.createGametes(gameteCount);
fatherGametes = father.createGametes(gameteCount);

function isGameteDisabled(gamete, disabledAlleles) {
  for (var ch in gamete) {
    var chromosome = gamete[ch];
    for (var i = 0; i < chromosome.alleles.length; ++i) {
      var allele = chromosome.alleles[i];
      // if any allele is disabled, the gamete is disabled
      if (disabledAlleles.indexOf(allele) >= 0) return true;
    }
  }
  // if no alleles are disabled, the gamete is enabled
  return false;
}

function isMotherGameteDisabled(gamete) {
  return isGameteDisabled(gamete, motherDisabledAlleles);
}

function isFatherGameteDisabled(gamete) {
  return isGameteDisabled(gamete, fatherDisabledAlleles);
}

function render() {
  // Mother org
  ReactDOM.render(React.createElement(GeniBlocks.OrganismView, { org: mother }), document.getElementById('mother'));
  // Father org
  ReactDOM.render(React.createElement(GeniBlocks.OrganismView, { org: father }), document.getElementById('father'));

  // Mother gamete filters
  if (showFilters) {
    ReactDOM.render(React.createElement(GeniBlocks.AlleleFiltersView, {
      species: mother.species,
      hiddenAlleles: hiddenAlleles,
      disabledAlleles: motherDisabledAlleles,
      onFilterChange: function onFilterChange(evt, allele, isChecked) {
        evt;
        var alleleIndex = motherDisabledAlleles.indexOf(allele),
            wasChecked = alleleIndex < 0;
        if (isChecked !== wasChecked) {
          if (isChecked) motherDisabledAlleles.splice(alleleIndex, 1);else {
            motherDisabledAlleles.push(allele);
            if (selectedMotherGamete && isMotherGameteDisabled(selectedMotherGamete)) {
              selectedMotherGameteId = null;
              selectedMotherGamete = null;
            }
          }
        }
        render();
      }
    }), document.getElementById('mother-allele-filters'));
  } else {
    ReactDOM.unmountComponentAtNode(document.getElementById('mother-allele-filters'));
    document.getElementById('mother-allele-filters').style.display = 'none';
  }

  // Father gamete filters
  if (showFilters) {
    ReactDOM.render(React.createElement(GeniBlocks.AlleleFiltersView, {
      species: father.species,
      hiddenAlleles: hiddenAlleles,
      disabledAlleles: fatherDisabledAlleles,
      onFilterChange: function onFilterChange(evt, allele, isChecked) {
        evt;
        var alleleIndex = fatherDisabledAlleles.indexOf(allele),
            wasChecked = alleleIndex < 0;
        if (isChecked !== wasChecked) {
          if (isChecked) fatherDisabledAlleles.splice(alleleIndex, 1);else {
            fatherDisabledAlleles.push(allele);
            if (selectedFatherGamete && isFatherGameteDisabled(selectedFatherGamete)) {
              selectedFatherGameteId = null;
              selectedFatherGamete = null;
            }
          }
        }
        render();
      }
    }), document.getElementById('father-allele-filters'));
  } else {
    ReactDOM.unmountComponentAtNode(document.getElementById('father-allele-filters'));
    document.getElementById('father-allele-filters').style.display = 'none';
  }

  // Mother gametes
  ReactDOM.render(React.createElement(GeniBlocks.GametePoolView, {
    gametes: motherGametes,
    hiddenAlleles: hiddenAlleles,
    width: gametePoolWidth,
    height: gametePoolHeight,
    animStiffness: animStiffness,
    selectedId: selectedMotherGameteId,
    isGameteDisabled: isMotherGameteDisabled,
    onGameteSelected: function onGameteSelected(evt, id, gameteViewportRect) {
      if (selectedMotherGameteId !== id) {
        prevSelectedMotherGameteId = selectedMotherGameteId;
        selectedMotherGameteId = id;
        selectedMotherGamete = motherGametes[selectedMotherGameteId - 1];
        selectedMotherGameteSrcRect = gameteViewportRect;
        offspring = null;
        render();
      }
    }
  }), document.getElementById('mother-gametes'));

  // Father gametes
  ReactDOM.render(React.createElement(GeniBlocks.GametePoolView, {
    gametes: fatherGametes,
    hiddenAlleles: hiddenAlleles,
    width: gametePoolWidth,
    height: gametePoolHeight,
    animStiffness: animStiffness,
    selectedId: selectedFatherGameteId,
    isGameteDisabled: isFatherGameteDisabled,
    onGameteSelected: function onGameteSelected(evt, id, gameteViewportRect) {
      if (selectedFatherGameteId !== id) {
        prevSelectedFatherGameteId = selectedFatherGameteId;
        selectedFatherGameteId = id;
        selectedFatherGamete = fatherGametes[selectedFatherGameteId - 1];
        selectedFatherGameteSrcRect = gameteViewportRect;
        offspring = null;
        render();
      }
    }
  }), document.getElementById('father-gametes'));

  // Offspring org
  function renderOffspring() {
    var offspringOpacity = fertilizationState === 'fertilized' ? 1.0 : 0.0;
    if (offspring) {
      ReactDOM.render(React.createElement(GeniBlocks.OrganismView, {
        org: offspring,
        initialStyle: { opacity: 0.0 },
        finalStyle: { opacity: offspringOpacity },
        onRest: function onRest() {
          selectedMotherGamete = selectedMotherGameteId = null;
          selectedFatherGamete = selectedFatherGameteId = null;
          fertilizationState = 'none';
          render();
        }
      }), document.getElementById('offspring'));
    } else {
      ReactDOM.unmountComponentAtNode(document.getElementById('offspring'));
    }
  }
  renderOffspring();

  // Mother selected gamete
  function renderSelectedMotherGamete() {
    if (!selectedMotherGameteId || selectedMotherGameteId !== prevSelectedMotherGameteId) {
      ReactDOM.unmountComponentAtNode(document.getElementById('mother-selected-gamete'));
    }
    if (selectedMotherGameteId) {
      var motherSelectedGameteViewportRect = document.getElementById('mother-selected-gamete').getBoundingClientRect();
      ReactDOM.render(React.createElement(GeniBlocks.FertilizingGameteView, {
        type: 'mother',
        gamete: selectedMotherGamete, id: selectedMotherGameteId,
        fertilizationState: fertilizationState,
        hiddenAlleles: hiddenAlleles,
        srcRect: selectedMotherGameteSrcRect,
        dstRect: motherSelectedGameteViewportRect,
        animStiffness: animStiffness,
        onRest: function onRest() {
          if (fertilizationState === 'fertilizing') {
            fertilizationState = 'fertilized';
            // currently we must unmount to trigger the next animation stage
            ReactDOM.unmountComponentAtNode(document.getElementById('mother-selected-gamete'));
            ReactDOM.unmountComponentAtNode(document.getElementById('father-selected-gamete'));
            renderSelectedMotherGamete();
            renderSelectedFatherGamete();
            renderOffspring();
          }
        }
      }), document.getElementById('mother-selected-gamete'));
      prevSelectedMotherGameteId = selectedMotherGameteId;
    }
  }
  renderSelectedMotherGamete();

  // Father selected gamete
  function renderSelectedFatherGamete() {
    if (!selectedFatherGameteId || selectedFatherGameteId !== prevSelectedFatherGameteId) {
      ReactDOM.unmountComponentAtNode(document.getElementById('father-selected-gamete'));
    }
    if (selectedFatherGameteId) {
      var fatherSelectedGameteViewportRect = document.getElementById('father-selected-gamete').getBoundingClientRect();
      ReactDOM.render(React.createElement(GeniBlocks.FertilizingGameteView, {
        type: 'father',
        gamete: selectedFatherGamete, id: selectedFatherGameteId,
        fertilizationState: fertilizationState,
        hiddenAlleles: hiddenAlleles,
        srcRect: selectedFatherGameteSrcRect,
        dstRect: fatherSelectedGameteViewportRect,
        animStiffness: animStiffness
      }), document.getElementById('father-selected-gamete'));
      prevSelectedFatherGameteId = selectedFatherGameteId;
    }
  }
  renderSelectedFatherGamete();
} // render()

function breed() {
  if (selectedMotherGamete && selectedFatherGamete) {
    fertilizationState = 'fertilizing';
    offspring = BioLogica.Organism.createFromGametes(mother.species, selectedMotherGamete, selectedFatherGamete);
    render();
  }
}

document.getElementById("breed-button").onclick = breed;

render();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImV4cGVyaW1lbnRzL21laW9zaXMvbWVpb3Npcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLElBQUksU0FBUyxJQUFJLFVBQVUsUUFBVixDQUFtQixVQUFVLE9BQVYsQ0FBa0IsS0FBbEIsRUFBeUIsMkdBQWhELEVBQTZKLENBQTdKLENBQVQ7SUFDQSxTQUFTLElBQUksVUFBVSxRQUFWLENBQW1CLFVBQVUsT0FBVixDQUFrQixLQUFsQixFQUF5QixpRkFBaEQsRUFBbUksQ0FBbkksQ0FBVDtJQUNBLGdCQUFnQixDQUFDLEdBQUQsRUFBSyxHQUFMLEVBQVMsR0FBVCxFQUFhLEdBQWIsRUFBaUIsR0FBakIsRUFBcUIsS0FBckIsRUFBMkIsSUFBM0IsQ0FBaEI7SUFDQSx3QkFBd0IsRUFBeEI7SUFDQSx3QkFBd0IsRUFBeEI7SUFDQSxjQUFjLEtBQWQ7SUFDQSxjQUFjLEVBQWQ7SUFDQSxnQkFBZ0IsR0FBaEI7SUFDQSxrQkFBa0IsR0FBbEI7SUFDQSxtQkFBbUIsR0FBbkI7SUFDQSxzQkFBc0IsRUFBdEI7SUFDQSwyQkFBMkIsR0FBM0I7SUFDQSxhQVpKO0lBYUksYUFiSjtJQWNJLDBCQWRKO0lBZUksc0JBZko7SUFnQkksb0JBaEJKO0lBaUJJLDJCQWpCSjtJQWtCSSwwQkFsQko7SUFtQkksc0JBbkJKO0lBb0JJLG9CQXBCSjtJQXFCSSwyQkFyQko7SUFzQkkscUJBQXFCLE1BQXJCOztBQUNBLFNBdkJKOztBQXlCQSxTQUFTLGdCQUFULENBQTBCLFdBQTFCLEVBQXVDO0FBQ25DLE1BQUksU0FBUyxFQUFUO01BQWEsT0FBakI7TUFBMEIsSUFBMUI7TUFBZ0MsQ0FBaEM7TUFBbUMsQ0FBbkM7OztBQURtQyxTQUluQyxHQUFVLFlBQVksS0FBWixDQUFrQixHQUFsQixDQUFWOzs7QUFKbUMsT0FPN0IsSUFBSSxDQUFKLEVBQU8sSUFBSSxRQUFRLE1BQVIsRUFBZ0IsSUFBSSxDQUFKLEVBQU8sR0FBeEMsRUFBOEM7QUFDMUMsV0FBTyxRQUFRLENB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QUNBLGlCQUFTLDJCQUFUO0FBQ0EsaUJBQVMsZ0NBQVQ7QUFDQSx1QkFBZSxhQUFmO09BUEYsQ0FERixFQVVFLFNBQVMsY0FBVCxDQUF3Qix3QkFBeEIsQ0FWRixFQUgwQjtBQWUxQixtQ0FBNkIsc0JBQTdCLENBZjBCO0tBQTVCO0dBSkY7QUFzQkEsK0JBbE5nQjtDQUFsQjs7QUFxTkEsU0FBUyxLQUFULEdBQWlCO0FBQ2YsTUFBSSx3QkFBd0Isb0JBQXhCLEVBQThDO0FBQ2hELHlCQUFxQixhQUFyQixDQURnRDtBQUVoRCxnQkFBWSxVQUFVLFFBQVYsQ0FBbUIsaUJBQW5CLENBQXFDLE9BQU8sT0FBUCxFQUFnQixvQkFBckQsRUFBMkUsb0JBQTNFLENBQVosQ0FGZ0Q7QUFHaEQsYUFIZ0Q7R0FBbEQ7Q0FERjs7QUFRQSxTQUFTLGNBQVQsQ0FBd0IsY0FBeEIsRUFBd0MsT0FBeEMsR0FBa0QsS0FBbEQ7O0FBRUEiLCJmaWxlIjoiZXhwZXJpbWVudHMvbWVpb3Npcy9tZWlvc2lzLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIG1vdGhlciA9IG5ldyBCaW9Mb2dpY2EuT3JnYW5pc20oQmlvTG9naWNhLlNwZWNpZXMuRHJha2UsIFwiYTptLGI6TSxhOmgsYjpoLGE6QyxiOkMsYTphLGI6YSxhOkIsYjpCLGE6RCxiOkQsYTp3LGI6VyxhOkZsLGI6RmwsYTpIbCxiOmhsLGE6VCxiOnQsYTpyaCxiOnJoLGE6Qm9nLGI6Qm9nXCIsIDEpLFxuICAgIGZhdGhlciA9IG5ldyBCaW9Mb2dpY2EuT3JnYW5pc20oQmlvTG9naWNhLlNwZWNpZXMuRHJha2UsIFwiYTpNLGE6aCxiOmgsYTpDLGI6QyxhOmEsYjphLGE6QixhOkQsYTpXLGE6ZmwsYjpmbCxhOkhsLGE6dCxiOlQsYTpyaCxhOkJvZyxiOkJvZ1wiLCAwKSxcbiAgICBoaWRkZW5BbGxlbGVzID0gWydoJywnYycsJ2EnLCdiJywnZCcsJ2JvZycsJ3JoJ10sXG4gICAgbW90aGVyRGlzYWJsZWRBbGxlbGVzID0gW10sXG4gICAgZmF0aGVyRGlzYWJsZWRBbGxlbGVzID0gW10sXG4gICAgc2hvd0ZpbHRlcnMgPSBmYWxzZSxcbiAgICBnYW1ldGVDb3VudCA9IDcyLFxuICAgIGFuaW1TdGlmZm5lc3MgPSAxMDAsXG4gICAgZ2FtZXRlUG9vbFdpZHRoID0gMzAwLFxuICAgIGdhbWV0ZVBvb2xIZWlnaHQgPSAzNTAsXG4gICAgZmlsdGVyZWRHYW1ldGVDb3VudCA9IDM1LFxuICAgIGZpbHRlcmVkR2FtZXRlUG9vbEhlaWdodCA9IDIwMCxcbiAgICBtb3RoZXJHYW1ldGVzLFxuICAgIGZhdGhlckdhbWV0ZXMsXG4gICAgcHJldlNlbGVjdGVkTW90aGVyR2FtZXRlSWQsXG4gICAgc2VsZWN0ZWRNb3RoZXJHYW1ldGVJZCxcbiAgICBzZWxlY3RlZE1vdGhlckdhbWV0ZSxcbiAgICBzZWxlY3RlZE1vdGhlckdhbWV0ZVNyY1JlY3QsXG4gICAgcHJldlNlbGVjdGVkRmF0aGVyR2FtZXRlSWQsXG4gICAgc2VsZWN0ZWRGYXRoZXJHYW1ldGVJZCxcbiAgICBzZWxlY3RlZEZhdGhlckdhbWV0ZSxcbiAgICBzZWxlY3RlZEZhdGhlckdhbWV0ZVNyY1JlY3QsXG4gICAgZmVydGlsaXphdGlvblN0YXRlID0gJ25vbmUnLCAgLy8gJ25vbmUnIC0+ICdmZXJ0aWxpemluZycgLT4gJ2ZlcnRpbGl6ZWQnIC0+ICdjb21wbGV0ZScgLT4gJ25vbmUnXG4gICAgb2Zmc3ByaW5nO1xuXG5mdW5jdGlvbiBwYXJzZVF1ZXJ5U3RyaW5nKHF1ZXJ5U3RyaW5nKSB7XG4gICAgdmFyIHBhcmFtcyA9IHt9LCBxdWVyaWVzLCB0ZW1wLCBpLCBsO1xuXG4gICAgLy8gU3BsaXQgaW50byBrZXkvdmFsdWUgcGFpcnNcbiAgICBxdWVyaWVzID0gcXVlcnlTdHJpbmcuc3BsaXQoJyYnKTtcblxuICAgIC8vIENvbnZlcnQgdGhlIGFycmF5IG9mIHN0cmluZ3MgaW50byBhbiBvYmplY3RcbiAgICBmb3IgKCBpID0gMCwgbCA9IHF1ZXJpZXMubGVuZ3RoOyBpIDwgbDsgaSsrICkge1xuICAgICAgICB0ZW1wID0gcXVlcmllc1tpXS5zcGxpdCgnPScpO1xuICAgICAgICBwYXJhbXNbdGVtcFswXV0gPSB0ZW1wWzFdO1xuICAgIH1cblxuICAgIHJldHVybiBwYXJhbXM7XG59XG5cbnZhciB1cmxQYXJhbXMgPSBwYXJzZVF1ZXJ5U3RyaW5nKCh3aW5kb3cubG9jYXRpb24uc2VhcmNoKS5zdWJzdHJpbmcoMSkpO1xuaWYgKHVybFBhcmFtcy5maWx0ZXIgJiYgKCh1cmxQYXJhbXMuZmlsdGVyLnRvTG93ZXJDYXNlKCkgPT09IFwidHJ1ZVwiKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgQm9vbGVhbihOdW1iZXIodXJsUGFyYW1zLmZpbHRlcikpKSkge1xuICBzaG93RmlsdGVycyA9IHRydWU7XG4gIGdhbWV0ZVBvb2xIZWlnaHQgPSBmaWx0ZXJlZEdhbWV0ZVBvb2xIZWlnaHQ7XG4gIGdhbWV0ZUNvdW50ID0gZmlsdGVyZWRHYW1ldGVDb3VudDtcbn1cbmlmICh1cmxQYXJhbXMuY291bnQgPiAwKVxuICBnYW1ldGVDb3VudCA9IE51bWJlcih1cmxQYXJhbXMuY291bnQpO1xuaWYgKHVybFBhcmFtcy5zcGVlZCA+IDApXG4gIGFuaW1TdGlmZm5lc3MgPSBOdW1iZXIodXJsUGFyYW1zLnNwZWVkKTtcblxubW90aGVyR2FtZXRlcyA9IG1vdGhlci5jcmVhdGVHYW1ldGVzKGdhbWV0ZUNvdW50KTtcbmZhdGhlckdhbWV0ZXMgPSBmYXRoZXIuY3JlYXRlR2FtZXRlcyhnYW1ldGVDb3VudCk7XG5cbmZ1bmN0aW9uIGlzR2FtZXRlRGlzYWJsZWQoZ2FtZXRlLCBkaXNhYmxlZEFsbGVsZXMpIHtcbiAgZm9yICh2YXIgY2ggaW4gZ2FtZXRlKSB7XG4gICAgdmFyIGNocm9tb3NvbWUgPSBnYW1ldGVbY2hdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hyb21vc29tZS5hbGxlbGVzLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgYWxsZWxlID0gY2hyb21vc29tZS5hbGxlbGVzW2ldO1xuICAgICAgLy8gaWYgYW55IGFsbGVsZSBpcyBkaXNhYmxlZCwgdGhlIGdhbWV0ZSBpcyBkaXNhYmxlZFxuICAgICAgaWYgKGRpc2FibGVkQWxsZWxlcy5pbmRleE9mKGFsbGVsZSkgPj0gMClcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIC8vIGlmIG5vIGFsbGVsZXMgYXJlIGRpc2FibGVkLCB0aGUgZ2FtZXRlIGlzIGVuYWJsZWRcbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBpc01vdGhlckdhbWV0ZURpc2FibGVkKGdhbWV0ZSkge1xuICByZXR1cm4gaXNHYW1ldGVEaXNhYmxlZChnYW1ldGUsIG1vdGhlckRpc2FibGVkQWxsZWxlcyk7XG59XG5cbmZ1bmN0aW9uIGlzRmF0aGVyR2FtZXRlRGlzYWJsZWQoZ2FtZXRlKSB7XG4gIHJldHVybiBpc0dhbWV0ZURpc2FibGVkKGdhbWV0ZSwgZmF0aGVyRGlzYWJsZWRBbGxlbGVzKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyKCkge1xuICAvLyBNb3RoZXIgb3JnXG4gIFJlYWN0RE9NLnJlbmRlcihcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEdlbmlCbG9ja3MuT3JnYW5pc21WaWV3LCB7b3JnOiBtb3RoZXJ9KSxcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW90aGVyJylcbiAgKTtcbiAgLy8gRmF0aGVyIG9yZ1xuICBSZWFjdERPTS5yZW5kZXIoXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudChHZW5pQmxvY2tzLk9yZ2FuaXNtVmlldywge29yZzogZmF0aGVyfSksXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZhdGhlcicpXG4gICk7XG5cbiAgLy8gTW90aGVyIGdhbWV0ZSBmaWx0ZXJzXG4gIGlmIChzaG93RmlsdGVycykge1xuICAgIFJlYWN0RE9NLnJlbmRlcihcbiAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoR2VuaUJsb2Nrcy5BbGxlbGVGaWx0ZXJzVmlldywge1xuICAgICAgICBzcGVjaWVzOiBtb3RoZXIuc3BlY2llcyxcbiAgICAgICAgaGlkZGVuQWxsZWxlczogaGlkZGVuQWxsZWxlcyxcbiAgICAgICAgZGlzYWJsZWRBbGxlbGVzOiBtb3RoZXJEaXNhYmxlZEFsbGVsZXMsXG4gICAgICAgIG9uRmlsdGVyQ2hhbmdlOiBmdW5jdGlvbihldnQsIGFsbGVsZSwgaXNDaGVja2VkKSB7XG4gICAgICAgICAgZXZ0O1xuICAgICAgICAgIHZhciBhbGxlbGVJbmRleCA9IG1vdGhlckRpc2FibGVkQWxsZWxlcy5pbmRleE9mKGFsbGVsZSksXG4gICAgICAgICAgICAgIHdhc0NoZWNrZWQgPSBhbGxlbGVJbmRleCA8IDA7XG4gICAgICAgICAgaWYgKGlzQ2hlY2tlZCAhPT0gd2FzQ2hlY2tlZCkge1xuICAgICAgICAgICAgaWYgKGlzQ2hlY2tlZClcbiAgICAgICAgICAgICAgbW90aGVyRGlzYWJsZWRBbGxlbGVzLnNwbGljZShhbGxlbGVJbmRleCwgMSk7XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgbW90aGVyRGlzYWJsZWRBbGxlbGVzLnB1c2goYWxsZWxlKTtcbiAgICAgICAgICAgICAgaWYgKHNlbGVjdGVkTW90aGVyR2FtZXRlICYmIGlzTW90aGVyR2FtZXRlRGlzYWJsZWQoc2VsZWN0ZWRNb3RoZXJHYW1ldGUpKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRNb3RoZXJHYW1ldGVJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRNb3RoZXJHYW1ldGUgPSBudWxsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlbmRlcigpO1xuICAgICAgICB9XG4gICAgICB9KSxcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb3RoZXItYWxsZWxlLWZpbHRlcnMnKVxuICAgICk7XG4gIH1cbiAgZWxzZSB7XG4gICAgUmVhY3RET00udW5tb3VudENvbXBvbmVudEF0Tm9kZShkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW90aGVyLWFsbGVsZS1maWx0ZXJzJykpO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb3RoZXItYWxsZWxlLWZpbHRlcnMnKS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICB9XG5cbiAgLy8gRmF0aGVyIGdhbWV0ZSBmaWx0ZXJzXG4gIGlmIChzaG93RmlsdGVycykge1xuICAgIFJlYWN0RE9NLnJlbmRlcihcbiAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoR2VuaUJsb2Nrcy5BbGxlbGVGaWx0ZXJzVmlldywge1xuICAgICAgICBzcGVjaWVzOiBmYXRoZXIuc3BlY2llcyxcbiAgICAgICAgaGlkZGVuQWxsZWxlczogaGlkZGVuQWxsZWxlcyxcbiAgICAgICAgZGlzYWJsZWRBbGxlbGVzOiBmYXRoZXJEaXNhYmxlZEFsbGVsZXMsXG4gICAgICAgIG9uRmlsdGVyQ2hhbmdlOiBmdW5jdGlvbihldnQsIGFsbGVsZSwgaXNDaGVja2VkKSB7XG4gICAgICAgICAgZXZ0O1xuICAgICAgICAgIHZhciBhbGxlbGVJbmRleCA9IGZhdGhlckRpc2FibGVkQWxsZWxlcy5pbmRleE9mKGFsbGVsZSksXG4gICAgICAgICAgICAgIHdhc0NoZWNrZWQgPSBhbGxlbGVJbmRleCA8IDA7XG4gICAgICAgICAgaWYgKGlzQ2hlY2tlZCAhPT0gd2FzQ2hlY2tlZCkge1xuICAgICAgICAgICAgaWYgKGlzQ2hlY2tlZClcbiAgICAgICAgICAgICAgZmF0aGVyRGlzYWJsZWRBbGxlbGVzLnNwbGljZShhbGxlbGVJbmRleCwgMSk7XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZmF0aGVyRGlzYWJsZWRBbGxlbGVzLnB1c2goYWxsZWxlKTtcbiAgICAgICAgICAgICAgaWYgKHNlbGVjdGVkRmF0aGVyR2FtZXRlICYmIGlzRmF0aGVyR2FtZXRlRGlzYWJsZWQoc2VsZWN0ZWRGYXRoZXJHYW1ldGUpKSB7XG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRGYXRoZXJHYW1ldGVJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRGYXRoZXJHYW1ldGUgPSBudWxsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlbmRlcigpO1xuICAgICAgICB9XG4gICAgICB9KSxcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmYXRoZXItYWxsZWxlLWZpbHRlcnMnKVxuICAgICk7XG4gIH1cbiAgZWxzZSB7XG4gICAgUmVhY3RET00udW5tb3VudENvbXBvbmVudEF0Tm9kZShkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmF0aGVyLWFsbGVsZS1maWx0ZXJzJykpO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmYXRoZXItYWxsZWxlLWZpbHRlcnMnKS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICB9XG5cbiAgLy8gTW90aGVyIGdhbWV0ZXNcbiAgUmVhY3RET00ucmVuZGVyKFxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoR2VuaUJsb2Nrcy5HYW1ldGVQb29sVmlldywge1xuICAgICAgZ2FtZXRlczogbW90aGVyR2FtZXRlcyxcbiAgICAgIGhpZGRlbkFsbGVsZXM6IGhpZGRlbkFsbGVsZXMsXG4gICAgICB3aWR0aDogZ2FtZXRlUG9vbFdpZHRoLFxuICAgICAgaGVpZ2h0OiBnYW1ldGVQb29sSGVpZ2h0LFxuICAgICAgYW5pbVN0aWZmbmVzczogYW5pbVN0aWZmbmVzcyxcbiAgICAgIHNlbGVjdGVkSWQ6IHNlbGVjdGVkTW90aGVyR2FtZXRlSWQsXG4gICAgICBpc0dhbWV0ZURpc2FibGVkOiBpc01vdGhlckdhbWV0ZURpc2FibGVkLFxuICAgICAgb25HYW1ldGVTZWxlY3RlZDogZnVuY3Rpb24oZXZ0LCBpZCwgZ2FtZXRlVmlld3BvcnRSZWN0KSB7XG4gICAgICAgIGlmIChzZWxlY3RlZE1vdGhlckdhbWV0ZUlkICE9PSBpZCkge1xuICAgICAgICAgIHByZXZTZWxlY3RlZE1vdGhlckdhbWV0ZUlkID0gc2VsZWN0ZWRNb3RoZXJHYW1ldGVJZDtcbiAgICAgICAgICBzZWxlY3RlZE1vdGhlckdhbWV0ZUlkID0gaWQ7XG4gICAgICAgICAgc2VsZWN0ZWRNb3RoZXJHYW1ldGUgPSBtb3RoZXJHYW1ldGVzW3NlbGVjdGVkTW90aGVyR2FtZXRlSWQgLSAxXTtcbiAgICAgICAgICBzZWxlY3RlZE1vdGhlckdhbWV0ZVNyY1JlY3QgPSBnYW1ldGVWaWV3cG9ydFJlY3Q7XG4gICAgICAgICAgb2Zmc3ByaW5nID0gbnVsbDtcbiAgICAgICAgICByZW5kZXIoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pLFxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb3RoZXItZ2FtZXRlcycpXG4gICk7XG5cbiAgLy8gRmF0aGVyIGdhbWV0ZXNcbiAgUmVhY3RET00ucmVuZGVyKFxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoR2VuaUJsb2Nrcy5HYW1ldGVQb29sVmlldywge1xuICAgICAgZ2FtZXRlczogZmF0aGVyR2FtZXRlcyxcbiAgICAgIGhpZGRlbkFsbGVsZXM6IGhpZGRlbkFsbGVsZXMsXG4gICAgICB3aWR0aDogZ2FtZXRlUG9vbFdpZHRoLFxuICAgICAgaGVpZ2h0OiBnYW1ldGVQb29sSGVpZ2h0LFxuICAgICAgYW5pbVN0aWZmbmVzczogYW5pbVN0aWZmbmVzcyxcbiAgICAgIHNlbGVjdGVkSWQ6IHNlbGVjdGVkRmF0aGVyR2FtZXRlSWQsXG4gICAgICBpc0dhbWV0ZURpc2FibGVkOiBpc0ZhdGhlckdhbWV0ZURpc2FibGVkLFxuICAgICAgb25HYW1ldGVTZWxlY3RlZDogZnVuY3Rpb24oZXZ0LCBpZCwgZ2FtZXRlVmlld3BvcnRSZWN0KSB7XG4gICAgICAgIGlmIChzZWxlY3RlZEZhdGhlckdhbWV0ZUlkICE9PSBpZCkge1xuICAgICAgICAgIHByZXZTZWxlY3RlZEZhdGhlckdhbWV0ZUlkID0gc2VsZWN0ZWRGYXRoZXJHYW1ldGVJZDtcbiAgICAgICAgICBzZWxlY3RlZEZhdGhlckdhbWV0ZUlkID0gaWQ7XG4gICAgICAgICAgc2VsZWN0ZWRGYXRoZXJHYW1ldGUgPSBmYXRoZXJHYW1ldGVzW3NlbGVjdGVkRmF0aGVyR2FtZXRlSWQgLSAxXTtcbiAgICAgICAgICBzZWxlY3RlZEZhdGhlckdhbWV0ZVNyY1JlY3QgPSBnYW1ldGVWaWV3cG9ydFJlY3Q7XG4gICAgICAgICAgb2Zmc3ByaW5nID0gbnVsbDtcbiAgICAgICAgICByZW5kZXIoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pLFxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmYXRoZXItZ2FtZXRlcycpXG4gICk7XG5cbiAgLy8gT2Zmc3ByaW5nIG9yZ1xuICBmdW5jdGlvbiByZW5kZXJPZmZzcHJpbmcoKSB7XG4gICAgdmFyIG9mZnNwcmluZ09wYWNpdHkgPSAoZmVydGlsaXphdGlvblN0YXRlID09PSAnZmVydGlsaXplZCcgPyAxLjAgOiAwLjApO1xuICAgIGlmIChvZmZzcHJpbmcpIHtcbiAgICAgIFJlYWN0RE9NLnJlbmRlcihcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChHZW5pQmxvY2tzLk9yZ2FuaXNtVmlldywge1xuICAgICAgICAgICAgb3JnOiBvZmZzcHJpbmcsIFxuICAgICAgICAgICAgaW5pdGlhbFN0eWxlOiB7IG9wYWNpdHk6IDAuMCB9LFxuICAgICAgICAgICAgZmluYWxTdHlsZTogeyBvcGFjaXR5OiBvZmZzcHJpbmdPcGFjaXR5IH0sXG4gICAgICAgICAgICBvblJlc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBzZWxlY3RlZE1vdGhlckdhbWV0ZSA9IHNlbGVjdGVkTW90aGVyR2FtZXRlSWQgPSBudWxsO1xuICAgICAgICAgICAgICBzZWxlY3RlZEZhdGhlckdhbWV0ZSA9IHNlbGVjdGVkRmF0aGVyR2FtZXRlSWQgPSBudWxsO1xuICAgICAgICAgICAgICBmZXJ0aWxpemF0aW9uU3RhdGUgPSAnbm9uZSc7XG4gICAgICAgICAgICAgIHJlbmRlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pLFxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnb2Zmc3ByaW5nJylcbiAgICAgICk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgUmVhY3RET00udW5tb3VudENvbXBvbmVudEF0Tm9kZShkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnb2Zmc3ByaW5nJykpO1xuICAgIH1cbiAgfVxuICByZW5kZXJPZmZzcHJpbmcoKTtcblxuICAvLyBNb3RoZXIgc2VsZWN0ZWQgZ2FtZXRlXG4gIGZ1bmN0aW9uIHJlbmRlclNlbGVjdGVkTW90aGVyR2FtZXRlKCkge1xuICAgIGlmICghc2VsZWN0ZWRNb3RoZXJHYW1ldGVJZCB8fCAoc2VsZWN0ZWRNb3RoZXJHYW1ldGVJZCAhPT0gcHJldlNlbGVjdGVkTW90aGVyR2FtZXRlSWQpKSB7XG4gICAgICBSZWFjdERPTS51bm1vdW50Q29tcG9uZW50QXROb2RlKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb3RoZXItc2VsZWN0ZWQtZ2FtZXRlJykpO1xuICAgIH1cbiAgICBpZiAoc2VsZWN0ZWRNb3RoZXJHYW1ldGVJZCkge1xuICAgICAgdmFyIG1vdGhlclNlbGVjdGVkR2FtZXRlVmlld3BvcnRSZWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vdGhlci1zZWxlY3RlZC1nYW1ldGUnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgUmVhY3RET00ucmVuZGVyKFxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEdlbmlCbG9ja3MuRmVydGlsaXppbmdHYW1ldGVWaWV3LCB7XG4gICAgICAgICAgdHlwZTogJ21vdGhlcicsXG4gICAgICAgICAgZ2FtZXRlOiBzZWxlY3RlZE1vdGhlckdhbWV0ZSwgaWQ6IHNlbGVjdGVkTW90aGVyR2FtZXRlSWQsXG4gICAgICAgICAgZmVydGlsaXphdGlvblN0YXRlOiBmZXJ0aWxpemF0aW9uU3RhdGUsIFxuICAgICAgICAgIGhpZGRlbkFsbGVsZXM6IGhpZGRlbkFsbGVsZXMsXG4gICAgICAgICAgc3JjUmVjdDogc2VsZWN0ZWRNb3RoZXJHYW1ldGVTcmNSZWN0LFxuICAgICAgICAgIGRzdFJlY3Q6IG1vdGhlclNlbGVjdGVkR2FtZXRlVmlld3BvcnRSZWN0LFxuICAgICAgICAgIGFuaW1TdGlmZm5lc3M6IGFuaW1TdGlmZm5lc3MsXG4gICAgICAgICAgb25SZXN0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChmZXJ0aWxpemF0aW9uU3RhdGUgPT09ICdmZXJ0aWxpemluZycpIHtcbiAgICAgICAgICAgICAgZmVydGlsaXphdGlvblN0YXRlID0gJ2ZlcnRpbGl6ZWQnO1xuICAgICAgICAgICAgICAvLyBjdXJyZW50bHkgd2UgbXVzdCB1bm1vdW50IHRvIHRyaWdnZXIgdGhlIG5leHQgYW5pbWF0aW9uIHN0YWdlXG4gICAgICAgICAgICAgIFJlYWN0RE9NLnVubW91bnRDb21wb25lbnRBdE5vZGUoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vdGhlci1zZWxlY3RlZC1nYW1ldGUnKSk7XG4gICAgICAgICAgICAgIFJlYWN0RE9NLnVubW91bnRDb21wb25lbnRBdE5vZGUoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZhdGhlci1zZWxlY3RlZC1nYW1ldGUnKSk7XG4gICAgICAgICAgICAgIHJlbmRlclNlbGVjdGVkTW90aGVyR2FtZXRlKCk7XG4gICAgICAgICAgICAgIHJlbmRlclNlbGVjdGVkRmF0aGVyR2FtZXRlKCk7XG4gICAgICAgICAgICAgIHJlbmRlck9mZnNwcmluZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSksXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb3RoZXItc2VsZWN0ZWQtZ2FtZXRlJylcbiAgICAgICk7XG4gICAgICBwcmV2U2VsZWN0ZWRNb3RoZXJHYW1ldGVJZCA9IHNlbGVjdGVkTW90aGVyR2FtZXRlSWQ7XG4gICAgfVxuICB9XG4gIHJlbmRlclNlbGVjdGVkTW90aGVyR2FtZXRlKCk7XG5cbiAgLy8gRmF0aGVyIHNlbGVjdGVkIGdhbWV0ZVxuICBmdW5jdGlvbiByZW5kZXJTZWxlY3RlZEZhdGhlckdhbWV0ZSgpIHtcbiAgICBpZiAoIXNlbGVjdGVkRmF0aGVyR2FtZXRlSWQgfHwgKHNlbGVjdGVkRmF0aGVyR2FtZXRlSWQgIT09IHByZXZTZWxlY3RlZEZhdGhlckdhbWV0ZUlkKSkge1xuICAgICAgUmVhY3RET00udW5tb3VudENvbXBvbmVudEF0Tm9kZShkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmF0aGVyLXNlbGVjdGVkLWdhbWV0ZScpKTtcbiAgICB9XG4gICAgaWYgKHNlbGVjdGVkRmF0aGVyR2FtZXRlSWQpIHtcbiAgICAgIHZhciBmYXRoZXJTZWxlY3RlZEdhbWV0ZVZpZXdwb3J0UmVjdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmYXRoZXItc2VsZWN0ZWQtZ2FtZXRlJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIFJlYWN0RE9NLnJlbmRlcihcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChHZW5pQmxvY2tzLkZlcnRpbGl6aW5nR2FtZXRlVmlldywge1xuICAgICAgICAgIHR5cGU6ICdmYXRoZXInLFxuICAgICAgICAgIGdhbWV0ZTogc2VsZWN0ZWRGYXRoZXJHYW1ldGUsIGlkOiBzZWxlY3RlZEZhdGhlckdhbWV0ZUlkLFxuICAgICAgICAgIGZlcnRpbGl6YXRpb25TdGF0ZTogZmVydGlsaXphdGlvblN0YXRlLCBcbiAgICAgICAgICBoaWRkZW5BbGxlbGVzOiBoaWRkZW5BbGxlbGVzLFxuICAgICAgICAgIHNyY1JlY3Q6IHNlbGVjdGVkRmF0aGVyR2FtZXRlU3JjUmVjdCxcbiAgICAgICAgICBkc3RSZWN0OiBmYXRoZXJTZWxlY3RlZEdhbWV0ZVZpZXdwb3J0UmVjdCxcbiAgICAgICAgICBhbmltU3RpZmZuZXNzOiBhbmltU3RpZmZuZXNzXG4gICAgICAgIH0pLFxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmF0aGVyLXNlbGVjdGVkLWdhbWV0ZScpXG4gICAgICApO1xuICAgICAgcHJldlNlbGVjdGVkRmF0aGVyR2FtZXRlSWQgPSBzZWxlY3RlZEZhdGhlckdhbWV0ZUlkO1xuICAgIH1cbiAgfVxuICByZW5kZXJTZWxlY3RlZEZhdGhlckdhbWV0ZSgpO1xufSAvLyByZW5kZXIoKVxuXG5mdW5jdGlvbiBicmVlZCgpIHtcbiAgaWYgKHNlbGVjdGVkTW90aGVyR2FtZXRlICYmIHNlbGVjdGVkRmF0aGVyR2FtZXRlKSB7XG4gICAgZmVydGlsaXphdGlvblN0YXRlID0gJ2ZlcnRpbGl6aW5nJztcbiAgICBvZmZzcHJpbmcgPSBCaW9Mb2dpY2EuT3JnYW5pc20uY3JlYXRlRnJvbUdhbWV0ZXMobW90aGVyLnNwZWNpZXMsIHNlbGVjdGVkTW90aGVyR2FtZXRlLCBzZWxlY3RlZEZhdGhlckdhbWV0ZSk7XG4gICAgcmVuZGVyKCk7XG4gIH1cbn1cblxuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJicmVlZC1idXR0b25cIikub25jbGljayA9IGJyZWVkO1xuXG5yZW5kZXIoKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==