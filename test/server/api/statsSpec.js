'use strict';

const expect = require('chai').expect;

process.env.NODE_ENV = 'test';

const generateEvents = require('../../../server/api/analytics/stats/generateEvents.js');
const chiSquareAnalysis = require('../../../server/api/analytics/stats/chiSquareAnalysis.js');

const testsInfo = generateEvents.testsInfo;
const { aClickRate, aTotalVisits, bClickRate, bTotalVisits } = testsInfo[0].testParams;

describe('Events generator', () => {

  const test1ATotalVisits = generateEvents.testsInfo[1].testParams.aTotalVisits;

  describe('Generate full tests data', () => {

    const tests = generateEvents.generateMultipleTestsWithDefaultParams();
    const test = tests[0];
    const testData = test.data;
    const test1 = tests[1];
    const test1Data = test1.data;

    it('should produce tests with the correct name and id', () => {
      expect(test.testName).to.equal('buyNowButtonTest');
      expect(test.testId).to.equal('3874E76');
    });

    it('should generate the right number of visits', () => {
      expect(testData.aVisits.length).to.equal(aTotalVisits);
      expect(testData.bVisits.length).to.equal(bTotalVisits);
      expect(test1Data.aVisits.length).to.equal(test1ATotalVisits);
    });

    it('should probably generate a number of clicks within a certain range', () => {
      expect(testData.aClicks.length).to.be.within(((aClickRate - 0.25) * aTotalVisits), ((aClickRate + 0.25) * aTotalVisits));
      expect(testData.bClicks.length).to.be.within(((bClickRate - 0.25) * bTotalVisits), ((bClickRate + 0.25) * bTotalVisits));
    });

    it('should generate visits of the correct format', () => {
      expect(typeof testData.aVisits[0].time).to.equal('number');
      expect(testData.aVisits[0].IPAddress.split('.')[0]).to.be.within(100, 999);
    });

    it('should generate clicks of the correct format', () => {
      expect(typeof testData.aClicks[0].time).to.equal('number');
      expect(testData.aClicks[0].IPAddress.split('.')[0]).to.be.within(100, 999);
    });
  });

  describe('Generate click and visit times arrays', () => {

    const tests = generateEvents.generateTimesForMultipleTests();
    const testData = tests[0].data;

    it('should generate visits in the correct format', () => {
      expect(typeof testData.aVisits[0]).to.equal('number');
    });

    it('should generate clicks in the correct format', () => {
      expect(typeof testData.aClicks[0]).to.equal('number');
    });
  });
});

describe('Chi Square Significance Analysis', () => {

  // Note that if the test data is changed, some of these tests will break.
  // This is intentional and ensures that appropriate test data is used.
  const sampleSize = 2587;
  const approxEvents = 2587 * 1.01;

  const tests = generateEvents.generateTimesForMultipleTests();
  const results = chiSquareAnalysis.computeStatsForTests(tests);

  it('should determine whether sufficient time has elapsed', () => {
    expect(results[0].stats.sufficientTime).to.be.true;
    expect(results[4].stats.sufficientTime).to.be.false;
  });

  it('should determine whether enough users have visited', () => {
    expect(results[0].stats.sufficientVisits).to.be.true;
    expect(results[3].stats.sufficientVisits).to.be.false;
  });

  it('should probably consider a reasonable number of clicks', () => {
    expect(results[0].stats.testResults.aClicksConsidered).to.be.within(((aClickRate - 0.30) * approxEvents), ((aClickRate + 0.30) * approxEvents));
    expect(results[0].stats.testResults.bClicksConsidered).to.be.within(((bClickRate - 0.30) * approxEvents), ((bClickRate + 0.30) * approxEvents));
  });

  it('should probably find a reasonable p value', () => {
    expect(results[0].stats.testResults.p).to.be.within(0, 0.05);
    expect(results[2].stats.testResults.p).to.be.within(0, 1);
  });

});