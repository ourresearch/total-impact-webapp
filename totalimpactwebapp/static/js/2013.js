function positionNumber(numberOffset){
  var number$ = $("#number")
  var numberHeight = number$.height()

  var windowHalfwayPoint = $(window).height()/2 - number$.height()/2

  var numberViewportOffset = numberOffset - $(window).scrollTop()


  console.log("offset:", numberOffset)

  if (!number$.hasClass("fixed") && numberViewportOffset < windowHalfwayPoint){
    number$.addClass("fixed").css({
      top: windowHalfwayPoint
    })
  }
  else if (number$.hasClass("fixed") && numberViewportOffset >= windowHalfwayPoint) {
    number$.removeClass("fixed").css({
      top:0
    })
  }




}




$(function(){
  var windowHeight = $(window).height()
  $("div.header").css({
    height: windowHeight+"px",
    "margin-bottom": windowHeight/4 + "px"
  })
  var numberOffset = $("#number").offset().top

  $(window).scroll(function(){

    positionNumber(numberOffset)


  })

  console.log("foo!", windowHeight)

})