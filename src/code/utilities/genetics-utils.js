/**
 * Class providing utility functions for BioLogica genetics operations.
 * In some cases these are adapted from corresponding code in Geniverse.
 */
export default class GeneticsUtils {

  /**
   * Converts an allele string to a JavaScript object that maps genes to alleles.
   * This can be useful for comparison purposes, for instance.
   *
   * @param {BioLogica.Genetics} genetics - genetics object to use for gene mapping
   * @param {string} alleleString - allele string of form "a:h,b:h,a:a,b:a..." to be modified
   * @return {object} - gene map of form { horn: {a:"h", b:"h"}, armor: {a:"a", b:"a"}, ...} to use as defaults
   */
  static buildGeneMapFromAlleleString(genetics, alleleString) {
    let geneMap = {},
        alleleSubstrings = alleleString.split(",");
    for (const alleleSubstr of alleleSubstrings) {
      const [side, allele] = alleleSubstr.split(":"),
            gene = genetics.geneForAllele(allele);
      if (side && allele && gene) {
        if (!geneMap[gene]) geneMap[gene] = {};
        geneMap[gene][side] = allele;
      }
    }
    return geneMap;
  }

  /**
   * Given an allele string and a gene map defining a set of base (default) alleles,
   * returns a new allele string with missing alleles replaced by their defaults.
   *
   * @param {BioLogica.Genetics} genetics - genetics object to use for gene mapping
   * @param {string} alleleString - allele string of form "a:h,b:h,a:a,b:a..." to be modified
   * @param {object} baseGeneMap - gene map of form { horn: {a:"h", b:"h"}, armor: {a:"a", b:"a"}, ...}
   * @return {string} - updated allele string of form "a:h,b:h,a:a,b:a..."
   */
  static fillInMissingAllelesFromGeneMap(genetics, alleleString, baseGeneMap) {
    const dstGeneMap = GeneticsUtils.buildGeneMapFromAlleleString(genetics, alleleString);
    let   dstAlleleString = alleleString;
    for (const gene in dstGeneMap) {
      const geneValue = dstGeneMap[gene];
      if (!geneValue.a && baseGeneMap[gene] && baseGeneMap[gene].a) {
        dstAlleleString = dstAlleleString.replace(`b:${geneValue.b}`, `a:${baseGeneMap[gene].a},$&`);
      }
      if (!geneValue.b && baseGeneMap[gene] && baseGeneMap[gene].b) {
        dstAlleleString = dstAlleleString.replace(`a:${geneValue.a}`, `$&,b:${baseGeneMap[gene].b}`);
      }
    }
    return dstAlleleString;
  }

  /**
   * Given two allele strings, returns a new allele string in which missing alleles
   * in the first are replaced by defaults provided by the second allele string.
   *
   * @param {BioLogica.Genetics} genetics - genetics object to use for gene mapping
   * @param {string} alleleString - allele string of form "a:h,b:h,a:a,b:a..." to be modified
   * @param {string} baseAlleleString - allele string of form "a:h,b:h,a:a,b:a..." to use as defaults
   * @return {string} - updated allele string of form "a:h,b:h,a:a,b:a..."
   */
  static fillInMissingAllelesFromAlleleString(genetics, alleleString, baseAlleleString) {
    const baseGeneMap = GeneticsUtils.buildGeneMapFromAlleleString(genetics, baseAlleleString);
    return GeneticsUtils.fillInMissingAllelesFromGeneMap(genetics, alleleString, baseGeneMap);
  }

  /**
   * Returns the number of separate changes, including allele changes and sex changes,
   * required to match the phenotype of the 'testOrganism' to that of the 'targetOrganism'.
   *
   * @param {BioLogica.Organism} testOrganism - the organism to which changes would apply
   * @param {BioLogica.Organism} targetOrganism - the organism that serves as destination
   * @return {number} - the total number of changes required for the phenotypes to match
   */
  static numberOfChangesToReachPhenotype(testOrganism, targetOrganism) {
    let requiredChangeCount = GeneticsUtils.numberOfAlleleChangesToReachPhenotype(
                                              testOrganism.phenotype.characteristics,
                                              targetOrganism.phenotype.characteristics,
                                              testOrganism.genetics.genotype.allAlleles,
                                              testOrganism.species.traitRules);
    if (testOrganism.sex !== targetOrganism.sex)
      ++requiredChangeCount;

    return requiredChangeCount;
  }

  /**
   * Returns the number of separate allele changes required to make the phenotype of
   * the organism characterized by 'testCharacterstics' match that of the organism
   * characterized by 'targetCharacteristics'. Adapted from:
   * @see https://github.com/concord-consortium/Geniverse-SproutCore/blob/master/frameworks/geniverse/controllers/match.js
   *
   * @param {object} testCharacteristics - the characteristics of the test organism
   * @param {object} targetCharacteristics - the characteristics of the target organism
   * @param {string[]} testAlleles - the array of alleles of the test organism
   * @param {object} traitRules - the traitRules of the BioLogica.Species of the organisms
   * @return {number} - the number of allele changes required for the phenotypes to match
   */
  static numberOfAlleleChangesToReachPhenotype(testCharacteristics, targetCharacteristics, testAlleles, traitRules) {
    const alleles = testAlleles;
    let   moves = 0;

    for (const trait in traitRules) {
      if (traitRules.hasOwnProperty(trait)) {
        if (testCharacteristics[trait] !== targetCharacteristics[trait]) {
          // first we have to work out what alleles the original drake has that correspond to
          // their non-matching trait
          const possibleTraitAlleles = GeneticsUtils.collectAllAllelesForTrait(trait, traitRules);
          let   characteristicAlleles = [];
          for (let i = 0, ii = alleles.length; i < ii; i++) {
            if (possibleTraitAlleles.indexOf(alleles[i]) >= 0){
              characteristicAlleles.push(alleles[i]);
            }
          }
          // now work out the smallest number of steps to get from there to the desired characteristic
          const possibleSolutions = traitRules[trait][targetCharacteristics[trait]];
          let   shortestPathLength = Infinity;
          for (let i = 0, ii = possibleSolutions.length; i < ii; i++) {
            let solution = possibleSolutions[i].slice(),
                pathLength = 0;
            for (let j = 0, jj = characteristicAlleles.length; j < jj; j++){
              if (solution.indexOf(characteristicAlleles[j]) === -1){
                pathLength++;
              } else {
                solution.splice(solution.indexOf(characteristicAlleles[j]), 1); // already matched this one, can't match it again
              }
            }
            shortestPathLength = (pathLength < shortestPathLength) ? pathLength : shortestPathLength;
          }
          moves += shortestPathLength;
        }
      }
    }
    return moves;
  }

  /**
   * Goes through the traitRules to find out what unique alleles are associated with each trait
   * e.g. For "tail" it will return ["T", "Tk", "t"]. Adapted from:
   * @see https://github.com/concord-consortium/Geniverse-SproutCore/blob/master/frameworks/geniverse/controllers/match.js
   *
   * @param {string} trait - name of trait, e.g. "tail"
   * @param {object} traitRules - the traitRules of the BioLogica.Species whose traits are of interest
   * @return {string[]} - array of allele strings, e.g. ["T", "Tk", "t"]
   */
  static _possibleAllelesForTrait = {};
  static collectAllAllelesForTrait(trait, traitRules) {
    if (GeneticsUtils._possibleAllelesForTrait[trait]) {
      return GeneticsUtils._possibleAllelesForTrait[trait];
    }

    let allelesHash = {},
        alleles     = [];
    for (const characteristic in traitRules[trait]){
        for (const possibileAllelesCombo in traitRules[trait][characteristic]) {
          if (traitRules[trait][characteristic].hasOwnProperty(possibileAllelesCombo)){
            for (let i = 0, ii = traitRules[trait][characteristic][possibileAllelesCombo].length; i < ii; i++) {
              allelesHash[traitRules[trait][characteristic][possibileAllelesCombo][i]] = 1;
            }
          }
        }
    }

    for (const allele in allelesHash){
      alleles.push(allele);
    }

    GeneticsUtils._possibleAllelesForTrait[trait] = alleles;  // store so we don't need to recalculate it
    return alleles;
  }
}