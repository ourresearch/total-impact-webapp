

/*!
 * jQuery viewportOffset - v0.3 - 2/3/2010
 * http://benalman.com/projects/jquery-misc-plugins/
 *
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */

// Like the built-in jQuery .offset() method, but calculates left and top from
// the element's position relative to the viewport, not the document.

!(function($){
  '$:nomunge'; // Used by YUI compressor.

  var win = $(window);

  $.fn.viewportOffset = function() {
    var offset = $(this).offset();

    return {
      left: offset.left - win.scrollLeft(),
      top: offset.top - win.scrollTop()
    };
  };

})(jQuery);



$(function(){
  var windowCenter = $(window).height() / 3;




  function positionNumber(numberTop){
    var number$ = $("#number")
    var numberViewportOffset = numberTop - $(window).scrollTop()

    if (!number$.hasClass("fixed") && numberViewportOffset < windowCenter){
      number$.addClass("fixed").css({
        top: windowCenter+"px"
      })
    }
    else if (number$.hasClass("fixed") && numberViewportOffset >= windowCenter) {
      number$.removeClass("fixed").css({
        top:numberTop
      })
    }
  }




  function changeNumber(){
    var facts = []
    var numberVal = $("#number-value")
    numberVal.removeClass("active")

    $("li.fact").each(function(i){
      var viewportOffset =  $(this).viewportOffset().top


      var halfwayOffset =  viewportOffset - (windowCenter + 70)
      var active = halfwayOffset < 0 && halfwayOffset > -$(this).height()


      var newFact = {
        count: parseInt($(this).attr("data-count")),
        'halfwayOffset': halfwayOffset,
        'halfwayDistance': Math.abs(halfwayOffset),
        'active': active
      }
      facts.push(newFact)

      if (newFact.active){
        console.log("viewport offset", viewportOffset, active, newFact.count)

      }



    })

    var factsAboveCenter = _.filter(facts, function(x){return x.halfwayOffset <= 0})
    var factsBelowCenter = _.filter(facts, function(x){return x.halfwayOffset > 0})

    var activeFact = _.findWhere(facts, {active: true})

    if (activeFact){
      count = activeFact.count
      numberVal.addClass("active")
    }

    else if (!factsAboveCenter.length){
      count = facts[0].count
    }

    else if (!factsBelowCenter.length) {
      count = _.last(facts).count

    }

    else {
      var factJustAboveCenter = _.sortBy(factsAboveCenter, function(x){return x.halfwayDistance})[0]
      var factJustBelowCenter = _.sortBy(factsBelowCenter, function(x){return x.halfwayDistance})[0]

      var distanceBetweenFacts = factJustAboveCenter.halfwayDistance + factJustBelowCenter.halfwayDistance

      var factCountDifference = factJustBelowCenter.count - factJustAboveCenter.count
      var countPerPixel = factCountDifference / distanceBetweenFacts

      var count = factJustAboveCenter.count + (countPerPixel * factJustAboveCenter.halfwayDistance)


    }

    numberVal.text(Math.floor(count))
  }





  var windowHeight = $(window).height()


  var numberTop = windowHeight+200
  $("#number").css("top", numberTop+"px")



  $("div.header").css({
    height: windowHeight+"px"
  })


  $("li.fact").css({
    "margin-bottom": windowHeight/2 + "px"
  })


  $(window).scroll(function(){
    positionNumber(numberTop)
    changeNumber()
  })


})