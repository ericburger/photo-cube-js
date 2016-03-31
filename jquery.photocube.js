/*
 * 3D Slideshow, Cube, and SliceBox Plugin
 * Written in jQuery
 *
 * @package the Alpine Press PhotoCube 3D
 * @version 0.1.2
 * @author Eric Burger
 * @link http://thealpinepress.com
 * @copyright: Eric Burger 2012
 * @license http://www.gnu.org/licenses/gpl-3.0.html
 * @last edited August 2012
 * 
 */


(function( w, s ) {
  s.fn.PhotoCubeJS = function( options ) {

    // Create some defaults, extending them with any options that were provided
    options = s.extend( {}, s.fn.PhotoCubeJS.options, options );
    // Now begin plugin code ( this = jQuery("# pcjs parent") )
    return this.each(function() { 

/*
 *  Variable Declaration
 *
 */   
      var container = this,containerDiv = s(this),
        parent,play = true,imgManager,args,iconSize,
        cube,moving=false,autoTimer,hoverEffects=true,largeIcons=false,
        cubeWidth,cubeHeight,paddingTop,paddingRight,paddingLeft,
        mouseOver,onScreen=true,imgList = s("."+options.imageListClass,container),
        allImages = s('.pcjsImage' ,imgList),
        cover = s("<div id='cover'></div>"),
        coverLink = s('<a id="cover-link" target="blank"></a>'),
        coverLinkContainer = s('<div id="cover-link-container" class="empty"></div>'),
        coverTextDiv = s('<div id="cover-text"></div>'),
        coverTextTitle = s('<h2 id="cover-text-title"></h2>'),
        coverTextExcerpt = s('<p id="cover-text-excerpt"></p>'),
        coverPlayPause = s('<div id="cover-play-pause" class="nav pause"></div>'),
        navNext = s('<div id="next" class="nav" ></div>'),
        navPrev = s('<div id="prev" class="nav"></div>');
      
/*////////////////////////////////////////////////////////////////////////////
   Setup:  Check for canvas support, add cover, deternime width/height,
           create cube object (also refers to slideshow and slicebox),
           create image list object, setup cover/nav, and initiate cube
/////////////////////////////////////////////////////////////////////////// */

      if(allImages.length){
        if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
          hoverEffects=false;
          options.numSlices = 3;
        }          
        // Check if canvas elements can be used
        if (Modernizr.canvas) {
          // Cool
        } else {
          // No native canvas support available :(
          if( 'slideshow' == options.style ){
            // Still ok
          }else{
            options.style = 'slideshow';
            options.special = 'slideshow_random';
          }
        }

        // To allow for automatic resizing, the user can set an aspect ratio (width to height) that will be applied to the cubes according to the parent's width
        if( 'slideshow' == options.style ){         
          parent = containerDiv;
          parent.addClass("pcjs-parent");
          cubeWidth = parent.width()*options.reduce/100;
          cubeHeight = cubeWidth*options.height/options.width;
          parent.height(cubeHeight);
          parent.css({
            "margin":"0px "+(containerDiv.width()*(100-options.reduce)/100/2)+"px",
          });
          paddingRight = paddingLeft = paddingTop = 0;      
        }else{
          s.fx.interval = options.interval; // Reduce animation frequency
          
          cubeWidth = containerDiv.width()*options.reduce/100;  
          cubeHeight = cubeWidth*options.height/options.width;
          parent = s('<div class="pcjs-parent"></div>');
          if(options.shadow){
            containerDiv.height(cubeHeight+60);
            parent.css({
              "position":"absolute",
              "top":-40,
              "right":-50+containerDiv.width()*(100-options.reduce)/100/2,
              "width":cubeWidth+100,
              "height":cubeHeight+100,
              "overflow":"hidden"
            })
            paddingRight = paddingLeft = 50;
            paddingTop = 50;
          }else{
            containerDiv.height(cubeHeight);
            parent.css({
              "position":"absolute",
              "top":-40,
              "right":-50+containerDiv.width()*(100-options.reduce)/100/2,
              "width":cubeWidth+100,
              "height":cubeHeight+80,
              "overflow":"hidden"
            })
            paddingRight = paddingLeft = 50;
            paddingTop =40;
          }
          containerDiv.append(parent);
        }
        
        if( /Android|webOS|iPhone|iPod|BlackBerry/i.test(navigator.userAgent) ){
          options.postExcerpt = false;
          iconSize = 0.12*cubeWidth;
          coverTextDiv.css({"max-width":"57%"});
        }else{
          iconSize = 0.1*cubeWidth;
        }  
        // Add cover but don't edit css yet
        parent.prepend(cover); 

        args = {crop:options.crop,shadow:options.shadow,perspective:2000,parent:parent,background:true,backgroundColor:options.background,border:false,borderColor:"#fff"};

        // Once dimensions are established...
        makeCube();
         
        // To avoid headaches and errors with IE, create ImageList Object
        // Wait till list is done before continueing
        imgManager = new pcjsImageList( allImages );

        if(imgManager&&imgManager.length){
          imgList.hide();
          setupCover();
          updateCover();
          startCube(); // Setup complete, begin...
        }
      }
      
/*////////////////////////////////////////////////////////////////////////////
   Function makeCube():  Create the cube object according to user input
            settings. Content specific characteristics are not included until startCube().
/////////////////////////////////////////////////////////////////////////// */

      function makeCube(){
        // First, determine transition type, which will impact everything else   
        if( 'slideshow' == options.style ) {
          cube = new pcjsSlideshow(cubeWidth,cubeHeight,paddingTop,paddingRight,paddingLeft,parent,options.background,options.crop);
        }
        else if( 'cube' == options.style ) {
          if( "cube_rot_x" == options.special || "cube_swing" == options.special ){
            cube = new pcjsPrism3D(cubeWidth,cubeHeight,cubeHeight,args);
            cube.addOrder(['front','top','back','bottom']);
          }else{ // cube_rot_y or cube_fall_in
            cube = new pcjsPrism3D(cubeWidth,cubeHeight,cubeWidth,args);
            cube.backFace.rotateImage();
            cube.addOrder(['front','right','back','left']);
          }
          // Give extra space to shadow
          if(options.shadow){
            cube.translateBy3D(0,(paddingTop-40),0);
            paddingTop -= (paddingTop-40);
          }
        }
        else if( 'slicebox' == options.style ) {          
          if( 'random' == options.numSlices ){
            var numbers = [3,5,8,12];
            options.numSlices = numbers[Math.floor(Math.random()*numbers.length)];
          }
          cube = new pcjsSliceBox3D(cubeWidth,cubeHeight,options.numSlices,args);
          // Give extra space to shadow
          if(options.shadow){
            cube.translateBy3D(0,(paddingTop-40),0);
            paddingTop -= (paddingTop-40);
          }
        }  
      }
      
/*////////////////////////////////////////////////////////////////////////////
   Function startCube():  Quick function to add images to cube, show on page,
        and initialize navigation buttons. This ends the cube setup.
/////////////////////////////////////////////////////////////////////////// */
      function startCube(){
  
        if('slideshow' == options.style || 'cube' == options.style ){
          cube.prev.addImage(imgManager.prev);
          cube.active.addImage(imgManager.active);
          cube.next.addImage(imgManager.next);
        }else if(options.style == 'slicebox'){
          cube.addImage(cube.prev,imgManager.prev);
          cube.addImage(cube.active,imgManager.active);
          cube.addImage(cube.next,imgManager.next);
        }

        if('cube' == options.style || options.style == 'slicebox'){
          cube.show();
        }
        
        setupNavFunctions();

      }

/*////////////////////////////////////////////////////////////////////////////
   Function cubeForward():  Call the cube object's forward function, 
        transition through the list object, and update the cover before
        begining the user input transition animation.
/////////////////////////////////////////////////////////////////////////// */
      function cubeForward() {    
        cube.forward();
        imgManager.forward();
        updateCover();
        
        if( 'slideshow' == options.style ){
          cube.next.addImage(imgManager.next); 
          if( 'slideshow_random' == options.special ){
            var slideshowOptions = ['slideshow_reveal','slideshow_drop','slideshow_rotate','slideshow_fade','slideshow_shutter','slideshow_up'];
            cube.animate(slideshowOptions[Math.floor(Math.random()*slideshowOptions.length)],'forward',options.time);
          }else{
            cube.animate(options.special,'forward',options.time);
          }
        }
        else if( 'cube' == options.style ){
          cube.next.addImage(imgManager.next);   
          if( "cube_rot_x" == options.special ){
            var by = {x:0,y:0,z:-cube.depth*5,thetaX:45,thetaY:0,thetaZ:0};
            var easing = {thetaX: 'easeInExpo'};
            cube.animateBy(by,options.time/2,easing,function(){
              by = {x:0,y:0,z:cube.depth*5,thetaX:45,thetaY:0,thetaZ:0};
              easing = {thetaX: 'easeOutExpo'};
              cube.animateBy(by,options.time/2,easing);
            });
          }else if( 'cube_fall_in' == options.special ){
            var by = {x:0,y:0,z:-cube.depth*5,thetaX:0,thetaY:-45,thetaZ:0};
            var easing = {z:'easeOutBounce',thetaY: 'easeInExpo'};
            cube.animateBy(by,options.time*2/3,easing,function(){
              by = {x:0,y:0,z:cube.depth*5,thetaX:0,thetaY:-45,thetaZ:0};
              easing = {thetaY: 'easeOutExpo'};
              cube.animateBy(by,options.time/3,easing);
            });
          }else if( 'cube_spin' == options.special ){
            var by = {x:0,y:0,z:-cube.depth*3,thetaX:0,thetaY:0,thetaZ:0};
            var easing = {z:'easeInOutQuad'};
            cube.animateBy(by,options.time/6,easing,function(){
              by = {x:0,y:0,z:0,thetaX:0,thetaY:-45,thetaZ:0};
              easing = {thetaY: 'easeInBack'};
              cube.animateBy(by,options.time/3,easing,function(){
                by = {x:0,y:0,z:0,thetaX:0,thetaY:-45,thetaZ:0};
                easing = {thetaY: 'easeOutBack'};
                cube.animateBy(by,options.time/3,easing,function(){
                  by = {x:0,y:0,z:cube.depth*3,thetaX:0,thetaY:0,thetaZ:0};
                  easing = {z:'easeInOutQuad'};
                  cube.animateBy(by,options.time/6,easing);
                });
              });
            });
          }else if( 'cube_swing' == options.special ){
            var by = {x:0,y:0,z:-cube.depth*2,thetaX:45,thetaY:0,thetaZ:0};
            var easing = {thetaX: 'easeInBack'};
            cube.animateBy(by,options.time/2,easing,function(){
              by = {x:0,y:0,z:cube.depth*2,thetaX:45,thetaY:0,thetaZ:0};
              easing = {thetaX: 'easeOutBack'};
              cube.animateBy(by,options.time/2,easing);
            });
          }else{ // cube_rot_y
            var by = {x:0,y:0,z:-cube.depth*1.4,thetaX:0,thetaY:-45,thetaZ:0};
            var easing = {thetaY: 'easeInExpo'};
            cube.animateBy(by,options.time/2,easing,function(){
              by = {x:0,y:0,z:cube.depth*1.4,thetaX:0,thetaY:-45,thetaZ:0};
              easing = {thetaY: 'easeOutExpo'};
              cube.animateBy(by,options.time/2,easing);
            });
          }
        }
        else if( 'slicebox' == options.style ){
          cube.addImage(cube.next,imgManager.next);
              
          if( 'slicebox_drop' == options.special ){
            cube.animateDrop(options.time,'forward');
          }else if( 'slicebox_quick' == options.special ){
            cube.animateQuick(options.time,'forward');
          }else if( 'slicebox_tip' == options.special ){
            cube.animateTip(options.time,'forward');
          }else if( 'slicebox_swing' == options.special ){
            cube.animateSwing(options.time,'forward');
          }else if( 'slicebox_bounce' == options.special ){
            cube.animateBounce(options.time,'forward');
          }else if( 'slicebox_random' == options.special ){
            var randomStyle = [
              function(){cube.animateDrop(options.time,'forward')},
              function(){cube.animateQuick(options.time,'forward')},
              function(){cube.animateTip(options.time,'forward')},
              function(){cube.animateSwing(options.time,'forward')},
              function(){cube.animateBounce(options.time,'forward')}
              ];
            randomStyle[Math.floor(Math.random()*randomStyle.length)]();
          }
        }
      } 
/*////////////////////////////////////////////////////////////////////////////
   Function cubeBack():  Same as cubeForward except in other direction.
/////////////////////////////////////////////////////////////////////////// */
      function cubeBack() { 
        cube.back();
        imgManager.back();
        updateCover();
  
        if( 'slideshow' == options.style ){
          cube.prev.addImage(imgManager.prev); 
          if( 'slideshow_random' == options.special ){
            var slideshowOptions = ['slideshow_reveal','slideshow_drop','slideshow_rotate','slideshow_fade','slideshow_shutter','slideshow_up'];
            cube.animate(slideshowOptions[Math.floor(Math.random()*slideshowOptions.length)],'back',options.time);
          }else{
            cube.animate(options.special,'back',options.time);
          }
        }
        else if( 'cube' == options.style ){      
          cube.prev.addImage(imgManager.prev); 
          if( 'cube_rot_x' == options.special ){
            var by = {x:0,y:0,z:-cube.depth*5,thetaX:-45,thetaY:0,thetaZ:0};
            var easing = {thetaX: 'easeInExpo'};
            cube.animateBy(by,options.time/2,easing,function(){
              by = {x:0,y:0,z:cube.depth*5,thetaX:-45,thetaY:0,thetaZ:0};
              easing = {thetaX: 'easeOutExpo'};
              cube.animateBy(by,options.time/2,easing);
            });
          }else if( 'cube_fall_in' == options.special ){
            var by = {x:0,y:0,z:-cube.depth*5,thetaX:0,thetaY:45,thetaZ:0};
            var easing = {z:'easeOutBounce',thetaY: 'easeInExpo'};
            cube.animateBy(by,options.time*2/3,easing,function(){
              by = {x:0,y:0,z:cube.depth*5,thetaX:0,thetaY:45,thetaZ:0};
              easing = {thetaY: 'easeOutExpo'};
              cube.animateBy(by,options.time/3,easing);
            });
          }else if( 'cube_spin' == options.special ){
            var by = {x:0,y:0,z:-cube.depth*3,thetaX:0,thetaY:0,thetaZ:0};
            var easing = {z:'easeInOutQuad'};
            cube.animateBy(by,options.time/6,easing,function(){
              by = {x:0,y:0,z:0,thetaX:0,thetaY:45,thetaZ:0};
              easing = {thetaY: 'easeInBack'};
              cube.animateBy(by,options.time/3,easing,function(){
                by = {x:0,y:0,z:0,thetaX:0,thetaY:45,thetaZ:0};
                easing = {thetaY: 'easeOutBack'};
                cube.animateBy(by,options.time/3,easing,function(){
                  by = {x:0,y:0,z:cube.depth*3,thetaX:0,thetaY:0,thetaZ:0};
                  easing = {z:'easeInOutQuad'};
                  cube.animateBy(by,options.time/6,easing);
                });
              });
            });
          }else if( 'cube_swing' == options.special ){
            var by = {x:0,y:0,z:-cube.depth*2,thetaX:-45,thetaY:0,thetaZ:0};
            var easing = {thetaX: 'easeInBack'};
            cube.animateBy(by,options.time/2,easing,function(){
              by = {x:0,y:0,z:cube.depth*2,thetaX:-45,thetaY:0,thetaZ:0};
              easing = {thetaX: 'easeOutBack'};
              cube.animateBy(by,options.time/2,easing);
            });
          }else{ // cube_rot_y 
            var by = {x:0,y:0,z:-cube.depth*1.5,thetaX:0,thetaY:45,thetaZ:0};
            var easing = {thetaY: 'easeInExpo'};
            cube.animateBy(by,options.time/2,easing,function(){
              by = {x:0,y:0,z:cube.depth*1.5,thetaX:0,thetaY:45,thetaZ:0};
              easing = {thetaY: 'easeOutExpo'};
              cube.animateBy(by,options.time/2,easing);
            });
          }
        }        
        else if( 'slicebox' == options.style ){
          cube.addImage(cube.prev,imgManager.prev); 
          if( 'slicebox_drop' == options.special ){
            cube.animateDrop(options.time,'back');
          }else if( 'slicebox_quick' == options.special ){
            cube.animateQuick(options.time,'back');
          }else if( 'slicebox_tip' == options.special ){
            cube.animateTip(options.time,'back');
          }else if( 'slicebox_swing' == options.special ){
            cube.animateSwing(options.time,'back');
          }else if( 'slicebox_bounce' == options.special ){
            cube.animateBounce(options.time,'back');
          }else if( 'slicebox_random' == options.special ){
            var randomStyle = [
              function(){cube.animateDrop(options.time,'back')},
              function(){cube.animateQuick(options.time,'back')},
              function(){cube.animateTip(options.time,'back')},
              function(){cube.animateSwing(options.time,'back')},
              function(){cube.animateBounce(options.time,'back')}
              ];
            randomStyle[Math.floor(Math.random()*randomStyle.length)]();
          }
        }
      }      
      
/*////////////////////////////////////////////////////////////////////////////
   Function setupCover():  Create cover div element, post link element,
        and mouseover detections before calling other functions to create
        nav buttons, cover text, and play/pause buttons.
/////////////////////////////////////////////////////////////////////////// */
      function setupCover(){
        cover.css({
          "width": cubeWidth,
          "height": cubeHeight,
          "margin-left":paddingLeft,
          "margin-right":paddingRight,
          "top":paddingTop,
        });
        
        if(options.imageLink){          
          cover.append(coverLinkContainer);
          coverLinkContainer.append(coverLink);  
        }
        
        parent.mouseenter(function(){
          mouseOver = true;
        }).mouseleave(function(){
          mouseOver = false;
        });   

        if(options.navHover){
          setupNavHover();
        }
        if(options.postTitle || options.postExcerpt){
          setupCoverText();    
        }   
        if(options.playPause && options.auto){
          setupPlayPause(); 
        }
      }
      
/*////////////////////////////////////////////////////////////////////////////
   Function updateCover():  Update cover link, title, and excerpt
/////////////////////////////////////////////////////////////////////////// */
      function updateCover(){
        if(options.imageLink){coverLink.attr('href', imgManager.active.perm).attr('alt', imgManager.active.alt).attr('title', imgManager.active.title);}  
        if(options.postTitle){setTimeout(function(){coverTextTitle.text(imgManager.active.title)},150);}
        if(options.postExcerpt){setTimeout(function(){coverTextExcerpt.text(imgManager.active.excerpt)},150);}
      }
/*////////////////////////////////////////////////////////////////////////////
   Function setupNavHover():  Setup hover navigation buttons, hide/show
        animations, and click functions.
/////////////////////////////////////////////////////////////////////////// */ 
      function setupNavHover(){      
        navNext.css({
          "position":"absolute",
          "left":iconSize*((options.playPause && options.auto)?2:1)+(0.04*cubeWidth),        
          "width":iconSize,
          "height":iconSize, 
          "opacity":(hoverEffects?0:1),
        });
        cover.append(navNext);
        navNext.addClass("forward");
        
        navPrev.css({
          "position":"absolute",
          "left":(0.03*cubeWidth),        
          "width":iconSize,
          "height":iconSize,      
          "opacity":(hoverEffects?0:1),   
        });   
        cover.append(navPrev);
        navPrev.addClass("back");
        
        if(hoverEffects){
          parent.hover(function (){
            navNext.stop().animate({"opacity":"1"},200);
            navPrev.stop().animate({"opacity":"1"},200);
          },function () {
            navNext.stop().animate({"opacity":"0"},200);
            navPrev.stop().animate({"opacity":"0"},200);
          });
        }
        
        navNext.click(function(){
          if(!moving){
            navNext.stop().animate({"opacity":"0.7"},200);
            navPrev.stop().animate({"opacity":"0.2"},200);
          }
        });
        navPrev.click(function(){
          if(!moving){
            navNext.stop().animate({"opacity":"0.2"},200);
            navPrev.stop().animate({"opacity":"0.7"},200);
          }
        });        
      }
      
/*////////////////////////////////////////////////////////////////////////////
   Function setupCoverText():  Setup cover title and excerpt. Also include
        hover animation and hide/show function that will be called from
        forward/back functions
/////////////////////////////////////////////////////////////////////////// */     
      function setupCoverText(){  
        coverTextDiv.css({
          "padding": (0.02*cubeWidth),
          "background-color": "rgba(255, 250, 250, 0.9)", 
          "opacity":(hoverEffects?0:1),
        });
        cover.append(coverTextDiv);
        
        if(options.postTitle){
          coverTextDiv.append(coverTextTitle);
        } 
        if(options.postExcerpt){
          coverTextDiv.append(coverTextExcerpt);
        }
        
        if(hoverEffects){
          parent.hover(function (){
            if(!moving){
              coverTextDiv.stop().animate({"opacity":1},200);
            }
          },function () {
            coverTextDiv.stop().animate({"opacity":0},200);
          });
        }
      }
      
      function hideShowText(){
        coverTextDiv.stop().animate({"opacity":0},200);
        setTimeout(function(){
          if(mouseOver){
            coverTextDiv.stop().animate({"opacity":1},200);
          }
        },options.time+100);
      }
/*////////////////////////////////////////////////////////////////////////////
   Function setupPlayPause():  Setup play/pause buttons. Button is 
        initialized as playing (showing the pause sign).
/////////////////////////////////////////////////////////////////////////// */  
      function setupPlayPause(){
        coverPlayPause.css({
          "position":"absolute",
          "left":iconSize*(options.navHover?1:0)+(0.035*cubeWidth),        
          "width":iconSize,
          "height":iconSize,
          "opacity":(hoverEffects?0:1),
        });
        cover.append(coverPlayPause);
               
        if(hoverEffects){
          parent.hover(function (){
            coverPlayPause.stop().animate({"opacity":1},200);  
          },function () {
            coverPlayPause.stop().animate({"opacity":0},200);
          });
        }
        
        if(options.navHover){
          navNext.click(function(){
            if(!moving){
              coverPlayPause.stop().animate({"opacity":"0.2"},200);
            }
          });
          navPrev.click(function(){
            if(!moving){
              coverPlayPause.stop().animate({"opacity":"0.2"},200);
            }
          });  
        }
      }
      
      
/*////////////////////////////////////////////////////////////////////////////
   Function setupNavFunctions():  After cube object and navigation buttons
          have be established, setup timer, forward, and back functions.
/////////////////////////////////////////////////////////////////////////// */  
      function setupNavFunctions() {
        if(options.auto){ 
          // Toggle play/pause button and start/clear timer
          if(options.playPause){
            coverPlayPause.click(function(){
              coverPlayPause.stop().animate({"opacity":"0.7"},200);
              if( coverPlayPause.hasClass('play') ){
                coverPlayPause.removeClass('play');
                coverPlayPause.addClass('pause');
                play = true;
                startTimer();              
              }else{
                coverPlayPause.removeClass('pause');
                coverPlayPause.addClass('play');
                play = false;
                clearInterval(autoTimer);
              }
            });
          }
        }
        
        s(".forward",parent).click(function(event) {
          // In case a link tag was clicked
          event.preventDefault();
          if(!moving){
            moving = true;
            if(options.auto&&onScreen){startTimer();}
            if( options.postTitle||options.postExcerpt ){hideShowText();}
            // Animate
            setTimeout(function(){
              cubeForward();
            },100);
            // Prevent click until animation is done
            setTimeout(function(){
              moving = false;
            },options.time+200);
          }
        });
        
        s(".back",parent).click(function(event) {
          // In case a link tag was clicked
          event.preventDefault();

          if(!moving){
            moving = true;
            if(options.auto&&onScreen){startTimer();}
            if( options.postTitle||options.postExcerpt ){hideShowText();}
            // Animate
            setTimeout(function(){
              cubeBack();
            },200);
            // Prevent click until animation is done
            setTimeout(function(){
              moving = false;
            },options.time+400);
          }
        });
        
        turnOnNav();
      }
      
      // Define startTimer Function
      function startTimer(){
        clearInterval(autoTimer); // Start clean
        autoTimer = setInterval(function(){
          if(!moving&&onScreen&&play){
            moving = true;
            if( options.postTitle||options.postExcerpt ){hideShowText();}
            // Animate
            setTimeout(function(){
              cubeForward();
            },200); // wait for hideShowText();
            // Prevent click until animation is done
            setTimeout(function(){
              moving = false;
            },options.time+400);
          }
        },(options.time+options.delay+1000) );

        if(!moving&&onScreen&&play){
          moving = true;
          if( options.postTitle||options.postExcerpt ){hideShowText();}
          // Animate
          setTimeout(function(){
            cubeForward();
          },200); // wait for hideShowText();
          // Prevent click until animation is done
          setTimeout(function(){
            moving = false;
          },options.time+400);
        }
      } 
/*////////////////////////////////////////////////////////////////////////////
   Function turnOnNav():  Begin timer according to user settings. Also add
        blur/focus detection.
/////////////////////////////////////////////////////////////////////////// */  
      function turnOnNav() {
        if(options.auto){
          if( options.playPause && options.startPaused ){
            // No startTimer()
            coverPlayPause.removeClass('pause');
            coverPlayPause.addClass('play');
            play = false;
          }else{
            // Initialize for the first time
            setTimeout(function(){
              startTimer();
            },options.time);
          }
          // Don't animate when no one is watching
          s(w).blur(function(){
            onScreen = false;
            clearInterval(autoTimer);
          });
          s(w).focus(function(){
            onScreen = true;
            setTimeout(function(){
              startTimer();
            },2000);
          });
        }
      }  
    });
  }; // End PhotoCubeJS()
        
  
  /////////////////////////////////////////////////////////
  /////////////////  Image List  //////////////////////////
  /////////////////////////////////////////////////////////
  function pcjsImageList(selected, callback){
    this.list = new Array();
    var theList = this.list;
    var lastImg = selected.length - 1;
    var title,src,alt,perm,excerpt,width,height,ctx,current;
          
    s.each(selected,function(){
      var on = s(this);
      title = on.attr('data-title');
      perm = on.attr('data-perm');
      excerpt = on.attr('data-excerpt');

      var img = s("img",on);
      // Images are all loaded. Check the naturalWidth and add to list accordingly
      ctx = img.get(0); // JS Image Object 
      width = ctx.naturalWidth;
      height = ctx.naturalHeight;
      
      src = img.attr('src');
      alt = img.attr('alt');

      if(width&&height){
        current = new pcjsImage(ctx,title,src,width,height,alt,perm,excerpt);
        theList.push(current);
      }
    });

    if(this.list.length){
      this.length = this.list.length;
      this.activePos = 0;
      this.nextPos = 1%this.length;
      this.prevPos = (this.length-1)%this.length;

      this.active = this.list[ this.activePos ];
      this.next = this.list[ this.nextPos ];
      this.prev = this.list[ this.prevPos ];
    }
  }
/*////////////////////////////////////////////////////////////////////////////
   Function forward():  Step forward through list
/////////////////////////////////////////////////////////////////////////// */
  pcjsImageList.prototype.forward = function(){
    this.prevPos = this.activePos;
    this.activePos = this.nextPos;
    this.nextPos = (this.activePos+1)%this.length;
    this.active = this.list[ this.activePos ];
    this.next = this.list[ this.nextPos ];
    this.prev = this.list[ this.prevPos ];
  }
/*////////////////////////////////////////////////////////////////////////////
   Function back():  Step backward through list
/////////////////////////////////////////////////////////////////////////// */  
  pcjsImageList.prototype.back = function(){
    this.nextPos = this.activePos;
    this.activePos = this.prevPos;
    this.prevPos = (this.activePos+this.length-1)%this.length;
    this.active = this.list[ this.activePos ];
    this.next = this.list[ this.nextPos ];
    this.prev = this.list[ this.prevPos ];
  }
/*////////////////////////////////////////////////////////////////////////////
   pcjsImage Object:  Store useful image/post info
/////////////////////////////////////////////////////////////////////////// */  
  function pcjsImage(img,title,src,width,height,alt,perm,excerpt){
    this.type = 'pcjsImage';
    this.title = title;
    this.img = img; // JS Image Object
    this.src = src;
    this.width = width;
    this.height = height;   
    this.alt = alt;
    this.perm = perm;
    this.excerpt = excerpt;
  }
  /////////////////////////////////////////////////////////
  ///////////////   Slideshow Object    ///////////////////
  /////////////////////////////////////////////////////////
  function pcjsSlideshow(width,height,paddingTop,paddingRight,paddingLeft,parent,background,crop){
    this.width = width;
    this.height = height;
        
    this.viewport = s('<div id="slideshow-viewport"></div>');
    this.viewport.css({
      "position":"absolute",
      "width": width,
      "height": height,
      "margin-left":paddingLeft,
      "margin-right":paddingRight,
      "top":paddingTop,
      "overflow":"hidden",
      "z-index":10
    });
    parent.append(this.viewport);
    
    this.slideContainer = s('<div id="slideshow-container"></div>');
    this.slideContainer.css({
      "position":"absolute",
      "width": width*3,
      "height": height*3,
      "top":-height,
      "left":-width,
      "overflow":"hidden",
      "z-index":10,
    });
    this.viewport.append(this.slideContainer);
    
    this.active = new pcjsSlide(width,height,width,this.slideContainer,background,crop);
    this.prev = new pcjsSlide(width,height,width*2,this.slideContainer,background,crop); 
    this.next =  new pcjsSlide(width,height,0,this.slideContainer,background,crop); 
    
    s('img',this.slideContainer).css({"max-width":width,"vertical-align":"bottom",});
  }
  
  pcjsSlideshow.prototype.forward = function(){
    var old = this.prev;
    this.prev = this.active;
    this.active = this.next;
    this.next = old;
  }
  pcjsSlideshow.prototype.back = function(){
    var old = this.next;
    this.next = this.active;
    this.active = this.prev;
    this.prev = old;
  }
/*////////////////////////////////////////////////////////////////////////////
   Function animate():  Animate slideshow given style, direction, and time
/////////////////////////////////////////////////////////////////////////// */  
  pcjsSlideshow.prototype.animate = function(style,direction,time){
    var width = this.width,
        height = this.height,
        active = this.active.slide;
        prev = this.prev.slide;
        next = this.next.slide;
        
    if( 'back' == direction ){
      prev.css({"right":0,"top":0,"opacity":0,"position":"absolute","z-index":1}); 
    }else{
      next.css({"right":0,"top":0,"opacity":0,"position":"absolute","z-index":1}); 
    }
    
    if( 'slideshow_reveal' == style ){ 
      if( 'back' == direction ){ 
        active.css({"right":width,"top":height,"opacity":1.0,"position":"absolute","z-index":5}); 
        next.css({"right":width,"top":height,"opacity":1.0,"z-index":10});
        next.animate({"right": 0},time, function(){
        }); 
      }else{
        active.css({"right":width,"top":height,"opacity":1.0,"position":"absolute","z-index":5}); 
        prev.css({"right":width,"top":height,"opacity":1.0,"z-index":10});
        prev.animate({"right": 2*width},time, function(){
        }); 
      }
    }
    else if( 'slideshow_drop' == style ){ 
      if( 'back' == direction ){
        active.css({"right":width,"top":0,"opacity":1.0,"position":"absolute","z-index":10}); 
        next.css({"right":width,"top":height,"opacity":1.0,"z-index":5});
        active.animate({"top": height},time, 'easeOutBounce', function(){
        }); 
      }else{
        active.css({"right":width,"top":0,"opacity":1.0,"position":"absolute","z-index":10}); 
        prev.css({"right":width,"top":height,"opacity":1.0,"z-index":5});
        active.animate({"top": height},time, 'easeOutBounce', function(){
        }); 
      }
    }  
    else if( 'slideshow_rotate' == style ){ 
      if( 'back' == direction ){
        active.css({"right":width*2,"top":height,"opacity":1.0,"position":"absolute","z-index":5}); 
        setTimeout(function(){
          active.animate({"right": width},time-100);
        },100);
        next.css({"right":width,"top":height,"opacity":1.0,"z-index":5});
        next.animate({"right": 0},time-100);
      }else{
        active.css({"right":0,"top":height,"opacity":1.0,"position":"absolute","z-index":5}); 
        setTimeout(function(){
          active.animate({"right": width},time-100);
        },100);
        prev.css({"right":width,"top":height,"opacity":1.0,"z-index":5});
        prev.animate({"right": width*2},time-100);
      }
    }   
    else if( 'slideshow_fade' == style ){ 
      if( 'back' == direction ){
        active.css({"right":width,"top":height,"opacity":0,"position":"absolute","z-index":10}); 
        active.animate({"opacity": 1},time);
        next.css({"right":width,"top":height,"opacity":1.0,"z-index":5});
      }else{
        active.css({"right":width,"top":height,"opacity":0,"position":"absolute","z-index":10}); 
        active.animate({"opacity": 1},time);
        prev.css({"right":width,"top":height,"opacity":1.0,"z-index":5});
      }
    } 
    else if( 'slideshow_shutter' == style ){ 
      if( 'back' == direction ){
        active.css({"right":width,"top":height*2,"opacity":0,"position":"absolute","z-index":5}); 
        next.css({"right":width,"top":height,"opacity":1.0,"z-index":5});
        next.animate({"top":height*2,"opacity":0},time/2-100);
        setTimeout(function(){
          active.animate({"top":height,"opacity":1},time/2);
        },time/2);
      }else{
        active.css({"right":width,"top":height*2,"opacity":0,"position":"absolute","z-index":5}); 
        prev.css({"right":width,"top":height,"opacity":1.0,"z-index":5});
        prev.animate({"top":height*2,"opacity":0},time/2-100);
        setTimeout(function(){
          active.animate({"top":height,"opacity":1},time/2);
        },time/2);
      }
    }  
    else if( 'slideshow_up' == style ){ 
      if( 'back' == direction ){
        active.css({"right":width,"top":height*2,"opacity":1.0,"position":"absolute","z-index":5}); 
        setTimeout(function(){
          active.animate({"top":height},time-100);
        },100);
        next.css({"right":width,"top":height,"opacity":1.0,"z-index":5});
        next.animate({"top":0,},time-200);  
      }else{
        active.css({"right":width,"top":height*2,"opacity":1.0,"position":"absolute","z-index":5}); 
        setTimeout(function(){
          active.animate({"top":height},time-100);
        },100);
        prev.css({"right":width,"top":height,"opacity":1.0,"z-index":5});
        prev.animate({"top":0,},time-200);        
      }
    } 
    else{
      if( 'back' == direction ){
        active.css({"right":width*2,"top":height,"opacity":1.0,"position":"absolute","z-index":5}); 
        setTimeout(function(){
          active.animate({"right": width},time);
        },100);
        next.css({"right":width,"top":height,"opacity":1.0,"z-index":5});
        next.animate({"right": 0},time);
      }else{
        active.css({"right":0,"top":height,"opacity":1.0,"position":"absolute","z-index":5}); 
        setTimeout(function(){
          active.animate({"right": width},time);
        },100);
        prev.css({"right":width,"top":height,"opacity":1.0,"z-index":5});
        prev.animate({"right": width*2},time);
      }
    }
  }
/*////////////////////////////////////////////////////////////////////////////
   pcjsSlide Object:
/////////////////////////////////////////////////////////////////////////// */  
  function pcjsSlide(width,height,pos,container,background,crop){
    this.width = width;
    this.height = height;
    this.background = (background?background:"#000");
    this.crop = (crop?true:false);
    this.slide = s('<div id="slideshow-slide"></div>');
    this.slide.css({
      "position":"absolute",
      "width": width,
      "height": height,
      "top":height,
      "right":pos,
      "text-align": "center",
      "overflow":"hidden",
      "background-color":this.background,
      "background-repeat":"no-repeat",
      "background-position":"50% 50%",
      "z-index":10,
    });    
    container.append(this.slide);
    
  }
  pcjsSlide.prototype.addImage = function(pcjsImage){
    this.slide.css("background-image", "url("+pcjsImage.src+")"); 
    
    if((pcjsImage.width/pcjsImage.height)>=(this.width/this.height) && pcjsImage.height>this.height){
      if(this.crop){
        this.slide.css("background-size", "auto 100%"); 
      }else{
        this.slide.css("background-size", "100% auto"); 
      }
    }else if((pcjsImage.width/pcjsImage.height)<(this.width/this.height) && pcjsImage.width>this.width){
      if(this.crop){
        this.slide.css("background-size", "100% auto"); 
      }else{
        this.slide.css("background-size", "auto 100%");
      }        
    }else{
      this.slide.css("background-size", "auto auto"); 
    }
  }
  
///////////////////////////////////////////////////////////
//////////////      3D Point Object        ////////////////
///////////////////////////////////////////////////////////
  function pcjsPoint3D(X, Y, Z) {
      this.x = X;
      this.y = Y;
      this.z = Z;
  }
/*////////////////////////////////////////////////////////////////////////////
   Point Function midPoint():
/////////////////////////////////////////////////////////////////////////// */ 
  pcjsPoint3D.prototype.midPoint = function(pt2){
    return new pcjsPoint3D((this.x+pt2.x)/2,(this.y+pt2.y)/2,(this.z+pt2.z)/2);
  }
/*////////////////////////////////////////////////////////////////////////////
   Point Function distanceTo():
/////////////////////////////////////////////////////////////////////////// */  
  pcjsPoint3D.prototype.distanceTo = function(pt2){
    if(pt2){
      return Math.sqrt((this.x-pt2.x)*(this.x-pt2.x)+(this.y-pt2.y)*(this.y-pt2.y)+(this.z-pt2.z)*(this.z-pt2.z));
    }else{
      return Math.sqrt((this.x)*(this.x)+(this.y)*(this.y)+(this.z)*(this.z));
    }
  }  
/*////////////////////////////////////////////////////////////////////////////
   Point Function rotateBy3D():
/////////////////////////////////////////////////////////////////////////// */    
  pcjsPoint3D.prototype.rotateBy3D = function(dAngleX,dAngleY,dAngleZ){
    dAngleX = (dAngleX+360)%360;
    dAngleY = (dAngleY+360)%360;
    dAngleZ = (dAngleZ+360)%360;

    var x = this.x,
        y = this.y,
        z = this.z,
        toDeg = Math.PI/180,
        sinX = Math.sin(dAngleX*toDeg),
        cosX = Math.cos(dAngleX*toDeg),
        sinY = Math.sin(dAngleY*toDeg),
        cosY = Math.cos(dAngleY*toDeg),
        sinZ = Math.sin(dAngleZ*toDeg),
        cosZ = Math.cos(dAngleZ*toDeg);
      
    this.x =  x*(cosY*cosZ) + 
              y*(-cosX*sinZ + sinX*sinY*cosZ) + 
              z*(sinX*sinZ + cosX*sinY*cosZ);
    this.y =  x*(cosY*sinZ) +            
              y*(cosX*cosZ + sinX*sinY*sinZ) + 
              z*(-sinX*cosZ + cosX*sinY*sinZ);
    this.z =  x*(-sinY) +
              y*(sinX*cosY) +
              z*(cosX*cosY); 
  }
/*////////////////////////////////////////////////////////////////////////////
   Point Function rotateAboutBy3D():
/////////////////////////////////////////////////////////////////////////// */   
  pcjsPoint3D.prototype.rotateAboutBy3D = function(dAngleX,dAngleY,dAngleZ,aPoint){
    dAngleX = (dAngleX+360)%360;
    dAngleY = (dAngleY+360)%360;
    dAngleZ = (dAngleZ+360)%360;

    var x = this.x - aPoint.x,
        y = this.y - aPoint.y,
        z = this.z - aPoint.z,
        toDeg = Math.PI/180,
        sinX = Math.sin(dAngleX*toDeg),
        cosX = Math.cos(dAngleX*toDeg),
        sinY = Math.sin(dAngleY*toDeg),
        cosY = Math.cos(dAngleY*toDeg),
        sinZ = Math.sin(dAngleZ*toDeg),
        cosZ = Math.cos(dAngleZ*toDeg);
        
    this.x =  x*(cosY*cosZ) + 
              y*(-cosX*sinZ + sinX*sinY*cosZ) + 
              z*(sinX*sinZ + cosX*sinY*cosZ) +
              aPoint.x;
    this.y =  x*(cosY*sinZ) +            
              y*(cosX*cosZ + sinX*sinY*sinZ) + 
              z*(-sinX*cosZ + cosX*sinY*sinZ) +
              aPoint.y;
    this.z =  x*(-sinY) +
              y*(sinX*cosY) +
              z*(cosX*cosY) +
              aPoint.z;    
  }
/*////////////////////////////////////////////////////////////////////////////
   Point Function translateBy3D():
/////////////////////////////////////////////////////////////////////////// */   
  pcjsPoint3D.prototype.translateBy3D = function(dX,dY,dZ){
      this.x += dX;
      this.y += dY;
      this.z += dZ;
  }
/*////////////////////////////////////////////////////////////////////////////
   Point Function projection3Dto2D():
/////////////////////////////////////////////////////////////////////////// */  
  pcjsPoint3D.prototype.projection3Dto2D = function(perspective){
    // Based on wiki 3D projection, adapted to use here given camera orientation is (0,0,0)
    // and camera position in (0,0,perspective)
    return new pcjsPoint3D(
      -(this.x)*(perspective/(this.z-perspective)),
       (this.y)*(perspective/(this.z-perspective)),
       0
    ); // Negative to change to right-hand axis
  }
  
///////////////////////////////////////////////////////////
///////////////////  Plane Object  ////////////////////////
///////////////////////////////////////////////////////////
  function pcjsPlane3D(width, height, args, inherit ) {
    this.width = width;
    this.height = height;
    this.angle = {// Relative to x-y plane, positive z is out of screen, angle is about given axis, counter-clockwise is positive
        x: 0,
        y: 0,
        z: 0
    };

    if(args['ctx']){
      this.ctx = args['ctx'];
      this.canvas = this.ctx.canvas;
    }else if(args['parent']){
      if(args['id']){
        this.canvas = s('<canvas id="slice-'+args['id']+'" width='+args["parent"].width()+' height='+args["parent"].height()+' style="position:absolute;top:0px;z-index:1"></canvas>');
        this.preCanvas = s('<canvas id="slice-'+args['id']+'" width='+args["parent"].width()+' height='+args["parent"].height()+' style="position:absolute;top:0px;z-index:1"></canvas>');
        args["parent"].append(this.canvas);
      }else{
        this.canvas = s('<canvas id="plane" width='+args["parent"].width()+' height='+args["parent"].height()+' style="position:absolute;top:0px;z-index:1"></canvas>');
        this.preCanvas = s('<canvas id="plane" width='+args["parent"].width()+' height='+args["parent"].height()+' style="position:absolute;top:0px;z-index:1"></canvas>');
        args["parent"].append(this.canvas); 
      }
    }
    this.canvasCenterX = this.canvas.width / 2;
    this.canvasCenterY = this.canvas.height / 2;

    var clone = s(this.ctx.canvas).clone();
    this.preCtx = clone[0].getContext('2d');
    this.preCanvas = this.preCtx.canvas;
    
    if(inherit){
      this.position = inherit.pos;
      this.topLeft = inherit.tl;
      this.topRight = inherit.tr;
      this.bottomRight = inherit.br;
      this.bottomLeft = inherit.bl;
      this.points = [this.topLeft,this.topRight,this.bottomRight,this.bottomLeft];
    }
    else{
      this.position = new pcjsPoint3D(0,0,0); // Center of plane
      // Clockwise, starting with top-left
      this.topLeft = new pcjsPoint3D(-width/2, height/2, 0);
      this.topRight = new pcjsPoint3D( width/2, height/2, 0);
      this.bottomRight = new pcjsPoint3D( width/2, -height/2, 0);
      this.bottomLeft = new pcjsPoint3D(-width/2, -height/2, 0);
      this.points = [this.topLeft,this.topRight,this.bottomRight,this.bottomLeft];
    }
    
    this.crop = (args['crop']?true:false);
    
    this.perspective = (args['perspective']?args['perspective']:2000);

    this.background = (args['background']?true:false);
    this.backgroundColor = (args['backgroundColor']?args['backgroundColor']:"#000");
    this.preCtx.fillStyle = this.backgroundColor;  
    
    if(args['shadow']){
      this.shadow = true;
      this.shadowColor = (args['shadowColor']?args['shadowColor']:"#D8D8D8");
      //this.canvasShadow = this.canvas;
      //this.ctxShadow = this.ctx;
    }

    this.border = (args['border']?true:false);
    this.borderColor = (args['borderColor']?args['borderColor']:"#fff");
    this.preCtx.strokeStyle = this.borderColor;  
    this.preCtx.lineWidth = 1;
      
    this.hasImage = false;
    this.img = '';

    this.imgTopLeft = new pcjsPoint3D(0, 0, 0);
    this.imgTopRight = new pcjsPoint3D(0, 0, 0);
    this.imgBottomRight = new pcjsPoint3D(0, 0, 0);
    this.imgBottomLeft = new pcjsPoint3D(0, 0, 0);
    this.imgPoints = [this.imgTopLeft,this.imgTopRight,this.imgBottomRight,this.imgBottomLeft];
    
    this.imgAdjust = {sx:0,sy:0,sw:0,sh:0};
    this.imgPadding = {top:0,right:0,bottom:0,left:0};  
  }
/*////////////////////////////////////////////////////////////////////////////
   Plane Function addImageOnly(): Clear existing data and add image.
/////////////////////////////////////////////////////////////////////////// */ 
  pcjsPlane3D.prototype.addImageOnly = function(pcjsImg){
    this.removeImage();
    this.hasImage = true;
    this.img = pcjsImg;
  }
/*////////////////////////////////////////////////////////////////////////////
   Plane Function addImage(): Add images and determine the necessary padding.
/////////////////////////////////////////////////////////////////////////// */ 
  pcjsPlane3D.prototype.addImage = function(pcjsImg){
    this.removeImage();
    this.hasImage = true;
    this.img = pcjsImg;
    var excessH = 0, excessW = 0; // To be cropped
    var lessH =0, lessW = 0; // To be padded

    if((this.img.width/this.img.height)>=(this.width/this.height)){
      if(this.img.width<this.width){
        lessH = this.height - this.img.height;
        lessW = this.width - this.img.width;
        this.paddingImage(lessH/2,lessW/2,lessH/2,lessW/2);
      }else{
        if(this.crop){
          lessH = this.height - this.img.height;
          lessH = (lessH>=0?lessH:0);
          excessW = this.img.width - this.img.height*this.width/(this.height-lessH);
          this.adjustImage(excessW/2,0,this.img.width-excessW,this.img.height);
          this.paddingImage(lessH/2,0,lessH/2,0);
        }else{
          lessH = this.height - this.img.height/this.img.width*this.width;
          this.paddingImage(lessH/2,0,lessH/2,0);
        }
      }
    }
    else if((this.img.width/this.img.height)<(this.width/this.height)){
      if(this.img.height<this.height){
        lessH = this.height - this.img.height;
        lessW = this.width - this.img.width;
        this.paddingImage(lessH/2,lessW/2,lessH/2,lessW/2);
      }
      else{
        if(this.crop){
          lessW = this.width - this.img.width;
          lessW = (lessW>=0?lessW:0);
          excessH = this.img.height - this.img.width*this.height/(this.width-lessW);
          this.adjustImage(0,excessH/2,this.img.width,this.img.height-excessH);
          this.paddingImage(0,lessW/2,0,lessW/2);       
        }else{
          lessW = this.width - this.img.width/this.img.height*this.height;
          this.paddingImage(0,lessW/2,0,lessW/2);
        }
      }
    }
    this.updatePadding();
  }
/*////////////////////////////////////////////////////////////////////////////
   Plane Function removeImage(): Erase pointer to pcjsImage and set all 
        padding/adjustments to zero.
/////////////////////////////////////////////////////////////////////////// */
  pcjsPlane3D.prototype.removeImage = function(){
    this.hasImage = false;
    this.img = '';
    this.imgAdjust = {sx:0,sy:0,sw:0,sh:0};
    this.imgPadding = {top:0,right:0,bottom:0,left:0};  
  }
/*////////////////////////////////////////////////////////////////////////////
   Plane Function rotateImage(): Rotate image by 180 Degrees by switching 
      the corners of the plane
/////////////////////////////////////////////////////////////////////////// */
  pcjsPlane3D.prototype.rotateImage = function(){
    var tl = this.topLeft;
    this.topLeft = this.bottomRight;
    this.bottomRight = tl;
    var tr = this.topRight;
    this.topRight = this.bottomLeft;
    this.bottomLeft = tr;   
    
    this.updatePadding();
  }
/*////////////////////////////////////////////////////////////////////////////
   Plane Function adjustImage(): Allow for adjustment of image display by
        changing source width, source height, source x-position, and
        source y-position.
        
        TODO: Expand special. Auto detection is too error prone due to
        rounding.
/////////////////////////////////////////////////////////////////////////// */  
  pcjsPlane3D.prototype.adjustImage = function(sX,sY,sW,sH,special){
    this.imgAdjust = {sx:sX,sy:sY,sw:sW,sh:sH};
    this.imgPadding = {top:0,right:0,bottom:0,left:0}; 
    
    var excessH = 0, excessW = 0;
    if((sW/sH)>=(this.width/this.height)){
      if(sW<this.width){
        excessH = this.height - sH/sW*sW;
        excessW = this.width - sW/sH*sH;
      }
      else{
        excessH = this.height - sH/sW*this.width;
      }
    }
    else if((sW/sH)<(this.width/this.height)){
      if(sH<this.height){
        excessH = this.height - sH/sW*sW;
        excessW = this.width - sW/sH*sH;
      }else{
        excessW = this.width - sW/sH*this.height;
      }
    }
    
    this.paddingImage((excessH/2),(excessW/2),(excessH/2),(excessW/2));

    if(excessW||excessH){
      if(special=='left-side'){
        this.paddingImage((excessH/2),0,(excessH/2),(excessW));
      }else if(special=='right-side'){
        this.paddingImage((excessH/2),(excessW),(excessH/2),0);
      }
      // Check if centered
      else if(sX==0&&sY==0&&sH==this.img.height&&Math.round(sW)==Math.round(this.img.width)){
        this.paddingImage((excessH/2),(excessW/2),(excessH/2),(excessW/2));
      }
      // Entire Side
      else if(sX==0&&sY==0&&sH==this.img.height){
        // Left
        this.paddingImage((excessH/2),0,(excessH/2),(excessW));
      }
      else if(sX>0&&(sX+sW+0.0001)>=this.img.width&&sY==0&&sH==this.img.height){
        // Right
        this.paddingImage((excessH/2),(excessW),(excessH/2),0);
      }     
      else if(sX>0&&(sX+sW)<this.img.width&&sY==0&&sH==this.img.height){
        // Center
        this.paddingImage((excessH/2),0,(excessH/2),0);
      }
      else if(sX==0&&sY>=0&&sH<=this.img.height&&Math.round(sW)==Math.round(this.img.width)){
        // If height removed, but still centered
        this.paddingImage((excessH/2),(excessW/2),(excessH/2),(excessW/2));
      }

      // Top Corners
      else if(sX==0&&sY==0){
        this.paddingImage((excessH),0,0,(excessW));
      }  
      else if((sX+sW)>=this.img.width && sY==0){
        this.paddingImage((this.imgPadding.top + this.imgPadding.bottom),(this.imgPadding.left + this.imgPadding.right),0,0);  
      }  
      // Bottom Corners
      else if(sX==0 && (sY+sH)>=this.img.height){
        this.paddingImage(0,0,(this.imgPadding.top + this.imgPadding.bottom),(this.imgPadding.left + this.imgPadding.right));  
      }
      else if((sX+sW)>=this.img.width && (sY+sH)>=this.img.height){
        this.paddingImage(0,(this.imgPadding.left + this.imgPadding.right),(this.imgPadding.top + this.imgPadding.bottom),0); 
      }   
      // Edges
      else if(sX==0){
        this.imgPadding.left = this.imgPadding.left + this.imgPadding.right;
        this.imgPadding.right = 0;
      }  
      else if(sY==0){
        this.imgPadding.top = this.imgPadding.top + this.imgPadding.bottom;
        this.imgPadding.bottom = 0;
      }
      else if((sY+sH)>=this.img.height){
        this.imgPadding.bottom = this.imgPadding.top + this.imgPadding.bottom;
        this.imgPadding.top = 0;
      }
      else if((sX+sW)>=this.img.width){
        this.imgPadding.right = this.imgPadding.left + this.imgPadding.right;
        this.imgPadding.left = 0;      
      }   
    }

    this.updatePadding();
  }
/*////////////////////////////////////////////////////////////////////////////
   Plane Function paddingImage(): Add padding around image.
/////////////////////////////////////////////////////////////////////////// */
  pcjsPlane3D.prototype.paddingImage = function(dTp,dRt,dBt,dLt){
    this.imgPadding = {
        top:dTp,
        right:dRt,
        bottom:dBt,
        left:dLt
    };
  }
/*////////////////////////////////////////////////////////////////////////////
   Plane Function updatePadding(): Calculate image corner points according
        to image padding.
/////////////////////////////////////////////////////////////////////////// */  
  pcjsPlane3D.prototype.updatePadding = function(){
    var lTBx = this.bottomLeft.x - this.topLeft.x,
        lTBy = this.bottomLeft.y - this.topLeft.y,
        lTBz = this.bottomLeft.z - this.topLeft.z,
        tRLx = this.topLeft.x - this.topRight.x,
        tRLy = this.topLeft.y - this.topRight.y,
        tRLz = this.topLeft.z - this.topRight.z,
        topH = this.imgPadding.top/this.height,
        bottomH = this.imgPadding.bottom/this.height,
        rightW = this.imgPadding.right/this.width,
        leftW = this.imgPadding.left/this.width,
        dxTop = (lTBx)*topH,
        dyTop = (lTBy)*topH,
        dzTop = (lTBz)*topH,
        dxBottom = (-lTBx)*bottomH,
        dyBottom = (-lTBy)*bottomH,
        dzBottom = (-lTBz)*bottomH, 
        dxRight = (tRLx)*rightW,
        dyRight = (tRLy)*rightW,
        dzRight = (tRLz)*rightW,   
        dxLeft = (-tRLx)*leftW,
        dyLeft = (-tRLy)*leftW,
        dzLeft = (-tRLz)*leftW;
         
    // Change the image position
    this.imgTopLeft.x = this.topLeft.x + dxTop + dxLeft;
    this.imgTopLeft.y = this.topLeft.y + dyTop + dyLeft;
    this.imgTopLeft.z = this.topLeft.z + dzTop + dzLeft;

    this.imgTopRight.x = this.topRight.x + dxTop + dxRight;
    this.imgTopRight.y = this.topRight.y + dyTop + dyRight;
    this.imgTopRight.z = this.topRight.z + dzTop + dzRight;
    
    this.imgBottomRight.x = this.bottomRight.x + dxBottom + dxRight;
    this.imgBottomRight.y = this.bottomRight.y + dyBottom + dyRight;
    this.imgBottomRight.z = this.bottomRight.z + dzBottom + dzRight;
    
    this.imgBottomLeft.x = this.bottomLeft.x + dxBottom + dxLeft;
    this.imgBottomLeft.y = this.bottomLeft.y + dyBottom + dyLeft;
    this.imgBottomLeft.z = this.bottomLeft.z + dzBottom + dzLeft;
  }
/*////////////////////////////////////////////////////////////////////////////
   Plane Function rotateBy3D(): 
/////////////////////////////////////////////////////////////////////////// */ 
  pcjsPlane3D.prototype.rotateBy3D = function(dAngleX,dAngleY,dAngleZ){
    this.angle = {
      x: (this.angle.x + dAngleX)%360,
      y: (this.angle.y + dAngleY)%360,
      z: (this.angle.z + dAngleZ)%360
    };
    for(var i=0;i<this.points.length;i++){
      this.points[i].rotateBy3D(dAngleX,dAngleY,dAngleZ);
    }
    if(this.hasImage){
      this.updatePadding();
    }
  }  
/*////////////////////////////////////////////////////////////////////////////
   Plane Function rotateAboutBy3D(): 
/////////////////////////////////////////////////////////////////////////// */   
  pcjsPlane3D.prototype.rotateAboutBy3D = function(dAngleX,dAngleY,dAngleZ,aPoint){
    this.angle = {
      x: (this.angle.x + dAngleX)%360,
      y: (this.angle.y + dAngleY)%360,
      z: (this.angle.z + dAngleZ)%360
    };
    this.position.rotateAboutBy3D(dAngleX,dAngleY,dAngleZ,aPoint);
    for(var i=0;i<this.points.length;i++){
      this.points[i].rotateAboutBy3D(dAngleX,dAngleY,dAngleZ,aPoint);
    }
    if(this.hasImage){
      this.updatePadding();
    }    
  }
/*////////////////////////////////////////////////////////////////////////////
   Plane Function translateBy3D(): 
/////////////////////////////////////////////////////////////////////////// */  
  pcjsPlane3D.prototype.translateBy3D = function(dX,dY,dZ){
    this.position.x = this.position.x + dX;
    this.position.y = this.position.y + dY;
    this.position.z = this.position.z + dZ;
    
    for(var i=0;i<this.points.length;i++){
      this.points[i].translateBy3D(dX,dY,dZ);
    }
    if(this.hasImage){
      this.updatePadding();
    }
  }
/*////////////////////////////////////////////////////////////////////////////
   Plane Function show(): Draw the plane background and image. Done by 
        drawing the background (default set to black), and then mapping
        the image into the background in 4 quadrilaterals ( 8 parallelograms 
        cropped to appear as 8 semi-triangles ). All done by taking
        2D projections of the plane's corner and image points.
        
        TODO: still seeing the image height slightly higher than 
        background in some browsers.
        TODO: Lighten/add opacity to background based on z-value
/////////////////////////////////////////////////////////////////////////// */ 
  pcjsPlane3D.prototype.show = function(){
    var topLeft2D = this.topLeft.projection3Dto2D(this.perspective),
        topRight2D = this.topRight.projection3Dto2D(this.perspective),
        bottomRight2D = this.bottomRight.projection3Dto2D(this.perspective),
        bottomLeft2D = this.bottomLeft.projection3Dto2D(this.perspective),
        ctx = this.preCtx,
        pcjsImg = this.img;
         
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // Create colored background
    if(this.background){
      ctx.beginPath();  
      ctx.moveTo(topLeft2D.x + ctx.canvas.width/2,    topLeft2D.y + ctx.canvas.height/2);  
      ctx.lineTo(topRight2D.x + ctx.canvas.width/2,   topRight2D.y + ctx.canvas.height/2);  
      ctx.lineTo(bottomRight2D.x + ctx.canvas.width/2, bottomRight2D.y + ctx.canvas.height/2);
      ctx.lineTo(bottomLeft2D.x + ctx.canvas.width/2, bottomLeft2D.y + ctx.canvas.height/2);
      ctx.lineTo(topLeft2D.x + ctx.canvas.width/2,    topLeft2D.y + ctx.canvas.height/2);
      ctx.closePath();
      ctx.fill(); 
    }
      
    if(this.hasImage&&pcjsImg.src){
      var imgTopLeft2D = this.imgTopLeft.projection3Dto2D(this.perspective),
        imgTopRight2D = this.imgTopRight.projection3Dto2D(this.perspective),
        imgBottomRight2D = this.imgBottomRight.projection3Dto2D(this.perspective),
        imgBottomLeft2D = this.imgBottomLeft.projection3Dto2D(this.perspective);
      
      var imgPts = [
        { x:imgTopLeft2D.x + this.canvasCenterX,
          y:imgTopLeft2D.y + this.canvasCenterY},
        { x:imgTopRight2D.x + this.canvasCenterX,
          y:imgTopRight2D.y + this.canvasCenterY},
        { x:imgBottomRight2D.x + this.canvasCenterX,
          y:imgBottomRight2D.y + this.canvasCenterY},
        { x:imgBottomLeft2D.x + this.canvasCenterX,  
          y:imgBottomLeft2D.y + this.canvasCenterY},
      ];   
      
      var adj ={
        sx:(this.imgAdjust.sx ? this.imgAdjust.sx : 0),
        sy:(this.imgAdjust.sy ? this.imgAdjust.sy : 0),
        sw:(this.imgAdjust.sw ? this.imgAdjust.sw : pcjsImg.width),
        sh:(this.imgAdjust.sh ? this.imgAdjust.sh : pcjsImg.height)       
      };
      // If projected image width is greater than 20, use two columns, otherwise, one.
      // This prevents breakup of image at very sharp angles.
      var numCol = ((imgTopLeft2D.distanceTo(imgTopRight2D))>40 ? 2 : 2); 
      var numRow = ((imgTopLeft2D.distanceTo(imgBottomLeft2D))>40 ? 2 : 2);

      for(var i=0; i<numCol;i++){
        // Increase the witdh for all but the right column
        var offsetX = (i<(numCol-1) ? 1.1 : 1);
        var colPts = [
          {x:imgPts[0].x+i/numCol*(imgPts[1].x-imgPts[0].x),  y:imgPts[0].y+i/numCol*(imgPts[1].y-imgPts[0].y)},
          {x:imgPts[0].x+(i+1)*offsetX/numCol*(imgPts[1].x-imgPts[0].x),  y:imgPts[0].y+(i+1)*offsetX/numCol*(imgPts[1].y-imgPts[0].y)},
          {x:imgPts[3].x+(i+1)*offsetX/numCol*(imgPts[2].x-imgPts[3].x),  y:imgPts[3].y+(i+1)*offsetX/numCol*(imgPts[2].y-imgPts[3].y)},
          {x:imgPts[3].x+i/numCol*(imgPts[2].x-imgPts[3].x),  y:imgPts[3].y+i/numCol*(imgPts[2].y-imgPts[3].y)}
        ];  
        for(var j=0; j<numRow;j++){
          // Increase the height for all but the bottom row
          var offsetY = (j<(numRow-1) ? 1.1 : 1);
          var points = [
            {x:colPts[0].x+j/numRow*(colPts[3].x-colPts[0].x), y:colPts[0].y+j/numRow*(colPts[3].y-colPts[0].y)},
            {x:colPts[1].x+j/numRow*(colPts[2].x-colPts[1].x), y:colPts[1].y+j/numRow*(colPts[2].y-colPts[1].y)},
            {x:colPts[1].x+(j+1)*offsetY/numRow*(colPts[2].x-colPts[1].x), y:colPts[1].y+(j+1)*offsetY/numRow*(colPts[2].y-colPts[1].y)},
            {x:colPts[0].x+(j+1)*offsetY/numRow*(colPts[3].x-colPts[0].x), y:colPts[0].y+(j+1)*offsetY/numRow*(colPts[3].y-colPts[0].y)}
          ];
          var adjust ={
            sx:adj.sx + i/numCol*adj.sw,
            sy:adj.sy + j/numRow*adj.sh,
            sw:adj.sw/numCol*offsetX,
            sh:adj.sh/numRow*offsetY     
          };
          imgMapper(points,adjust,pcjsImg,ctx);
        }
      }  
    } 
    
    if(this.border){
      ctx.beginPath();  
      ctx.moveTo(topLeft2D.x + ctx.canvas.width/2,    topLeft2D.y + ctx.canvas.height/2);  
      ctx.lineTo(topRight2D.x + ctx.canvas.width/2,   topRight2D.y + ctx.canvas.height/2);  
      ctx.lineTo(bottomRight2D.x + ctx.canvas.width/2, bottomRight2D.y + ctx.canvas.height/2);
      ctx.lineTo(bottomLeft2D.x + ctx.canvas.width/2, bottomLeft2D.y + ctx.canvas.height/2);
      ctx.lineTo(topLeft2D.x + ctx.canvas.width/2,    topLeft2D.y + ctx.canvas.height/2);
      ctx.closePath();
      ctx.stroke();
    }
    
    this.ctx.drawImage(this.preCanvas, 0, 0);
  }
/*////////////////////////////////////////////////////////////////////////////
   Plane Function imgMapper(): While not actually a plane function,
        the imgMapper function is written below to shorten the show 
        function. Given 4 points, an pcjsImg, and source adjustments,
        map image onto canvas using 2 triangles.
/////////////////////////////////////////////////////////////////////////// */ 
  function imgMapper(pts,adjust,pcjsImg,ctx){
    var imgWidth = pcjsImg.width,imgHeight = pcjsImg.height,
        sx = (adjust.sx>0?adjust.sx:0),
        sy = (adjust.sy>0?adjust.sy:0),
        sw = (adjust.sw>0?adjust.sw:imgWidth),
        sh = (adjust.sh>0?adjust.sh:imgHeight);

    // Triangle One
    // Plane coordinates
    var x0=pts[0].x, x1=pts[1].x, x2=pts[2].x, x3= x2 + .1*(pts[3].x-x2), x4= x0 + .1*(pts[3].x-x0);
    var y0=pts[0].y, y1=pts[1].y, y2=pts[2].y, y3= y2 + .1*(pts[3].y-y2), y4= y0 + .1*(pts[3].y-y0);

    // Picture coordinates (trinagle)
    var u0 = 0, u1 = imgWidth, u2 = imgWidth;
    var v0 = 0, v1 = 0,        v2 = imgHeight;
    
    // Set clipping area so that only pixels inside the triangle will
    // be affected by the image drawing operation
    ctx.save(); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4); ctx.closePath(); ctx.clip();

    // Compute matrix transform
    var delta = u0*v1 + v0*u2 + u1*v2 - v1*u2 - v0*u1 - u0*v2;
    var delta_a = x0*v1 + v0*x2 + x1*v2 - v1*x2 - v0*x1 - x0*v2;
    var delta_b = u0*x1 + x0*u2 + u1*x2 - x1*u2 - x0*u1 - u0*x2;
    var delta_d = y0*v1 + v0*y2 + y1*v2 - v1*y2 - v0*y1 - y0*v2;
    var delta_e = u0*y1 + y0*u2 + u1*y2 - y1*u2 - y0*u1 - u0*y2;

    // Draw the transformed image
    //x' = d00*x + d01*y + d02
    //y' = d10*x + d11*y + d12
    ctx.transform(delta_a/delta, delta_d/delta,
                  delta_b/delta, delta_e/delta,
                  pts[0].x, pts[0].y);
    if(pcjsImg.img.src){
      ctx.drawImage(pcjsImg.img, sx, sy, sw, sh, 0, 0, imgWidth, imgHeight); // dx and dy are in the transform
    }
    ctx.restore();
      
  // Triangle Two
    // Plane coordinates
    var x0=pts[2].x, x1=pts[3].x, x2=pts[0].x;
    var y0=pts[2].y, y1=pts[3].y, y2=pts[0].y;

    // Picture coordinates (trinagle)
    var u0 = imgWidth,  u1 = 0,          u2 = 0;
    var v0 = imgHeight, v1 = imgHeight,  v2 = 0;
    
    // Set clipping area so that only pixels inside the triangle will
    // be affected by the image drawing operation
    ctx.save(); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);ctx.closePath();ctx.clip();

    // Compute matrix transform
    var delta = u0*v1 + v0*u2 + u1*v2 - v1*u2 - v0*u1 - u0*v2;
    var delta_a = x0*v1 + v0*x2 + x1*v2 - v1*x2 - v0*x1 - x0*v2;
    var delta_b = u0*x1 + x0*u2 + u1*x2 - x1*u2 - x0*u1 - u0*x2;
    var delta_d = y0*v1 + v0*y2 + y1*v2 - v1*y2 - v0*y1 - y0*v2;
    var delta_e = u0*y1 + y0*u2 + u1*y2 - y1*u2 - y0*u1 - u0*y2;

    ctx.transform(delta_a/delta, delta_d/delta,
                  delta_b/delta, delta_e/delta,
                  pts[0].x, pts[0].y);
    if(pcjsImg.img.src){
      ctx.drawImage(pcjsImg.img, sx, sy, sw, sh, 0, 0, imgWidth, imgHeight); // dx and dy are in the transform
    }
    ctx.restore();
  }
/*////////////////////////////////////////////////////////////////////////////
   Plane Function isVisible(): Use cross product to determine if
      plane is facing in or out.
/////////////////////////////////////////////////////////////////////////// */ 
  pcjsPlane3D.prototype.isVisible = function(){
    var topLeft2D = this.topLeft.projection3Dto2D(this.perspective),
        topRight2D = this.topRight.projection3Dto2D(this.perspective),
        center2D = this.position.projection3Dto2D(this.perspective);
      
    // z component of vector normal to the plane
    var Nz = (topLeft2D.x - center2D.x)*(topRight2D.y - center2D.y) - (topRight2D.x - center2D.x)*(topLeft2D.y - center2D.y);

    if(Nz >= 0){return true;}else{return false;}
  }
  
  /////////////////////////////////////////////////////////
  /////////////////  Prism Object  ////////////////////////
  /////////////////////////////////////////////////////////
  function pcjsPrism3D(width, height, depth, args){
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.angle = {// Relative to x-y plane, positive z is out of screen, angle is about given axis, counter-clockwise is positive
        x: 0,
        y: 0,
        z: 0
    };
    this.position = new pcjsPoint3D(0,0,-depth/2);

    this.ftl = new pcjsPoint3D(-width/2,height/2,0);
    this.ftr = new pcjsPoint3D(width/2,height/2,0);
    this.fbr = new pcjsPoint3D(width/2,-height/2,0);
    this.fbl = new pcjsPoint3D(-width/2,-height/2,0);
    this.btl = new pcjsPoint3D(-width/2,height/2,-depth);
    this.btr = new pcjsPoint3D(width/2,height/2,-depth);
    this.bbr = new pcjsPoint3D(width/2,-height/2,-depth);
    this.bbl = new pcjsPoint3D(-width/2,-height/2,-depth);
    this.frontPos = new pcjsPoint3D(0,0,0);
    this.backPos = new pcjsPoint3D(0,0,-depth);
    this.topPos = new pcjsPoint3D(0,height/2,-depth/2);
    this.bottomPos = new pcjsPoint3D(0,-height/2,-depth/2);
    this.rightPos = new pcjsPoint3D(width/2,0,-depth/2);
    this.leftPos = new pcjsPoint3D(-width/2,0,-depth/2);
    this.points = [this.ftl,this.ftr,this.fbr,this.fbl,this.btl,this.btr,this.bbr,this.bbl,this.frontPos,this.backPos,this.topPos,this.bottomPos,this.rightPos,this.leftPos];
    
    if(args['ctx']){
      this.ctx = context;
      this.canvas = context.canvas;
    }else if(args['parent']){
      if(args['id']){
        this.canvas = s('<canvas id="slice-'+args['id']+'" width='+args["parent"].width()+' height='+args["parent"].height()+' style="position:absolute;top:0px;z-index:1"></canvas>');
        args["parent"].append(this.canvas);
      }else{
        this.canvas = s('<canvas id="header-cube" width='+args["parent"].width()+' height='+args["parent"].height()+' style="position:absolute;top:0px;z-index:1"></canvas>');
        args["parent"].append(this.canvas); 
      }
      this.ctx = this.canvas[0].getContext('2d');
    }
    
    if(args['shadow']){
      this.shadow = true;
      this.shadowColor = (args['shadowColor']?args['shadowColor']:"#D8D8D8");
      if(args['parent']){
        if(args['id']){
          this.canvasShadow = s('<canvas id="slice-shadow-'+args['id']+'" width='+args["parent"].width()+' height='+args["parent"].height()+' style="position:absolute;top:0px;z-index:-1"></canvas>');
          args["parent"].append(this.canvasShadow);
        }else{
          this.canvasShadow = s('<canvas id="header-shadow" width='+args["parent"].width()+' height='+args["parent"].height()+' style="position:absolute;top:0px;z-index:-1"></canvas>');
          args["parent"].append(this.canvasShadow); 
        }
        this.ctxShadow = this.canvasShadow[0].getContext('2d');
      }else{
        this.canvasShadow = this.canvas;
        this.ctxShadow = this.ctx;
      }
      var shadowClone = s(this.ctxShadow.canvas).clone();
      this.preShadowCtx = shadowClone[0].getContext('2d');
      this.preShadowCanvas = this.preShadowCtx.canvas;
      this.preShadowCtx.fillStyle = this.shadowColor;
      this.preShadowCtx.strokeStyle = this.shadowColor;
    }
    
    var clone = s(this.ctx.canvas).clone();
    this.preCtx = clone[0].getContext('2d');
    this.preCanvas = this.preCtx.canvas;

    this.crop = (args['crop']?true:false);
    
    this.background = (args['background']?true:false);
    this.backgroundColor = (args['backgroundColor']?args['backgroundColor']:"#000");
    
    this.border = (args['border']?true:false);
    this.borderColor = (args['borderColor']?args['borderColor']:"#fff");
    
    this.perspective = (args['perspective']?args['perspective']:2000);

    var childArgs = { ctx:this.ctx,crop:this.crop,background:this.background,backgroundColor:this.backgroundColor,shadow:this.shadow,shadowColor:this.shadowColor, border:this.border,borderColor:this.borderColor, perspective:this.perspective };
    var inherit = {pos:this.frontPos,tl:this.ftl,tr:this.ftr,br:this.fbr,bl:this.fbl};
    this.frontFace = new pcjsPlane3D( width, height, childArgs, inherit );
      inherit = {pos:this.backPos,tl:this.bbl,tr:this.bbr,br:this.btr,bl:this.btl};
    this.backFace = new pcjsPlane3D( width, height, childArgs, inherit );
      inherit = {pos:this.topPos,tl:this.btl,tr:this.btr,br:this.ftr,bl:this.ftl};
    this.topFace = new pcjsPlane3D( width, depth, childArgs, inherit );
      inherit = {pos:this.bottomPos,tl:this.fbl,tr:this.fbr,br:this.bbr,bl:this.bbl};
    this.bottomFace = new pcjsPlane3D( width, depth, childArgs, inherit );    
      inherit = {pos:this.rightPos,tl:this.ftr,tr:this.btr,br:this.bbr,bl:this.fbr};
    this.rightFace = new pcjsPlane3D( depth, height, childArgs, inherit );    
      inherit = {pos:this.leftPos,tl:this.btl,tr:this.ftl,br:this.fbl,bl:this.bbl};
    this.leftFace = new pcjsPlane3D( depth, height, childArgs, inherit );        
    this.faces = [this.frontFace,this.rightFace,this.backFace,this.leftFace,this.topFace,this.bottomFace];
        
    this.order = [];
    
    this.activePos = 0;
    this.nextPos = 0;
    this.prevPos = 0;
    
    this.active = '';
    this.next = '';
    this.prev = '';
    
  }
/*////////////////////////////////////////////////////////////////////////////
   Prism Function addOrder(): Determine the order in which cube 
        will be turning.
/////////////////////////////////////////////////////////////////////////// */   
  pcjsPrism3D.prototype.addOrder = function(order){
    this.order = new Array();
    var cPrism = this; 
    var newOrder = cPrism.order;
    
    for(i=0;i<order.length;i++){
      if(order[i]=='front'){
        newOrder.push(cPrism.frontFace);
      }else if(order[i]=='back'){
        newOrder.push(cPrism.backFace);
      }else if(order[i]=='right'){
        newOrder.push(cPrism.rightFace);
      }else if(order[i]=='left'){
        newOrder.push(cPrism.leftFace);
      }else if(order[i]=='top'){
        newOrder.push(cPrism.topFace);
      }else if(order[i]=='bottom'){
        newOrder.push(cPrism.bottomFace);
      }
    }
    
    if(cPrism.order.length){
      cPrism.activePos = 0;
      cPrism.nextPos = (cPrism.activePos+1)%cPrism.order.length;
      cPrism.prevPos = (cPrism.activePos+cPrism.order.length-1)%cPrism.order.length;
      
      cPrism.active = cPrism.order[cPrism.activePos];
      cPrism.next = cPrism.order[cPrism.nextPos];
      cPrism.prev = cPrism.order[cPrism.prevPos];
    }
  }
/*////////////////////////////////////////////////////////////////////////////
   Prism Function forward(): 
/////////////////////////////////////////////////////////////////////////// */     
  pcjsPrism3D.prototype.forward = function(){
    if(this.order.length){
      this.prevPos = this.activePos;
      this.activePos =  this.nextPos;
      this.nextPos = (this.activePos+1)%this.order.length;
      
      this.active = this.order[this.activePos];
      this.next = this.order[this.nextPos];
      this.prev = this.order[this.prevPos];  
    }
  }
/*////////////////////////////////////////////////////////////////////////////
   Prism Function back(): 
/////////////////////////////////////////////////////////////////////////// */    
  pcjsPrism3D.prototype.back = function(){
    if(this.order.length){
      this.nextPos = this.activePos;
      this.activePos =  this.prevPos;
      this.prevPos = (this.activePos+this.order.length-1)%this.order.length;
      
      this.active = this.order[this.activePos];
      this.next = this.order[this.nextPos];
      this.prev = this.order[this.prevPos];  
    }
  }
/*////////////////////////////////////////////////////////////////////////////
   Prism Function showShadow(): Map the shadow below cube. Always
        clear shadow canvas before drawing.
/////////////////////////////////////////////////////////////////////////// */ 
  pcjsPrism3D.prototype.showShadow = function(){
    var cPrism = this,
        ctx = cPrism.preShadowCtx,
        shadow = cPrism.ctxShadow,
        y = -shadow.canvas.height/2+5,
        centerY = (shadow.canvas.height)/2,
        centerX = (shadow.canvas.width)/2;

    var sbtl2D = new pcjsPoint3D(cPrism.btl.x, y, cPrism.btl.z).projection3Dto2D(cPrism.perspective),
        sbtr2D = new pcjsPoint3D(cPrism.btr.x, y, cPrism.btr.z).projection3Dto2D(cPrism.perspective),
        sbbr2D = new pcjsPoint3D(cPrism.bbr.x, y, cPrism.bbr.z).projection3Dto2D(cPrism.perspective),
        sbbl2D = new pcjsPoint3D(cPrism.bbl.x, y, cPrism.bbl.z).projection3Dto2D(cPrism.perspective),
        sftl2D = new pcjsPoint3D(cPrism.ftl.x, y, cPrism.ftl.z).projection3Dto2D(cPrism.perspective),
        sftr2D = new pcjsPoint3D(cPrism.ftr.x, y, cPrism.ftr.z).projection3Dto2D(cPrism.perspective),
        sfbr2D = new pcjsPoint3D(cPrism.fbr.x, y, cPrism.fbr.z).projection3Dto2D(cPrism.perspective),
        sfbl2D = new pcjsPoint3D(cPrism.fbl.x, y, cPrism.fbl.z).projection3Dto2D(cPrism.perspective),
        ftl2ftr = sftl2D.distanceTo(sftr2D),
        ftl2fbl = sftl2D.distanceTo(sfbl2D),
        ftl2btl = sftl2D.distanceTo(sbtl2D),
        bbl2bbr = sbbl2D.distanceTo(sbbr2D),
        bbr2btr = sbtr2D.distanceTo(sbbr2D),
        fbr2bbr = sfbr2D.distanceTo(sbbr2D);
   
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore(); 
    ctx.save();
    ctx.lineWidth = 1;
    // Map the given y values from 0 to canvasShadow.height
    // Front
    if( ftl2ftr*ftl2fbl ) {
      ctx.beginPath(); 
      ctx.moveTo(sftl2D.x + centerX,   ((sftl2D.y + centerY)/2 + centerY) );  
      ctx.lineTo(sftr2D.x + centerX,   ((sftr2D.y + centerY)/2 + centerY) );  
      ctx.lineTo(sfbr2D.x + centerX, ((sfbr2D.y + centerY)/2 + centerY) );    
      ctx.lineTo(sfbl2D.x + centerX, ((sfbl2D.y + centerY)/2 + centerY) );
      ctx.lineTo(sftl2D.x + centerX, ((sftl2D.y + centerY)/2 + centerY) );
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    }
    // Back
    if( bbl2bbr*bbr2btr ) {
      ctx.beginPath(); 
      ctx.moveTo(sbtl2D.x + centerX,    ((sbtl2D.y + centerY)/2 + centerY) );  
      ctx.lineTo(sbtr2D.x + centerX,   ((sbtr2D.y + centerY)/2 + centerY) );  
      ctx.lineTo(sbbr2D.x + centerX, ((sbbr2D.y + centerY)/2 + centerY) );    
      ctx.lineTo(sbbl2D.x + centerX, ((sbbl2D.y + centerY)/2 + centerY) );
      ctx.lineTo(sbtl2D.x + centerX, ((sbtl2D.y + centerY)/2 + centerY) );
      ctx.closePath();
      ctx.stroke();
      ctx.fill();  
    }
    // Right
    if( fbr2bbr*bbr2btr ) {
      ctx.beginPath();
      ctx.moveTo(sftr2D.x + centerX, ((sftr2D.y + centerY)/2 + centerY) ); 
      ctx.lineTo(sbtr2D.x + centerX, ((sbtr2D.y + centerY)/2 + centerY) );  
      ctx.lineTo(sbbr2D.x + centerX, ((sbbr2D.y + centerY)/2 + centerY) );
      ctx.lineTo(sfbr2D.x + centerX, ((sfbr2D.y + centerY)/2 + centerY) ); 
      ctx.lineTo(sftr2D.x + centerX, ((sftr2D.y + centerY)/2 + centerY) ); 
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    }
    // Left
    if( ftl2btl*ftl2fbl ) {
      ctx.beginPath();
      ctx.moveTo(sftl2D.x + centerX, ((sftl2D.y + centerY)/2 + centerY) ); 
      ctx.lineTo(sbtl2D.x + centerX, ((sbtl2D.y + centerY)/2 + centerY) );  
      ctx.lineTo(sbbl2D.x + centerX, ((sbbl2D.y + centerY)/2 + centerY) );
      ctx.lineTo(sfbl2D.x + centerX, ((sfbl2D.y + centerY)/2 + centerY) ); 
      ctx.lineTo(sftl2D.x + centerX, ((sftl2D.y + centerY)/2 + centerY) ); 
      ctx.closePath();
      ctx.stroke();
      ctx.fill(); 
    }
    // Bottom
    if( fbr2bbr*bbl2bbr ){
      ctx.beginPath(); 
      ctx.moveTo(sfbl2D.x + centerX,    ((sfbl2D.y + centerY)/2 + centerY) );
      ctx.lineTo(sbbl2D.x + centerX,   ((sbbl2D.y + centerY)/2 + centerY) ); 
      ctx.lineTo(sbbr2D.x + centerX, ((sbbr2D.y + centerY)/2 + centerY) );
      ctx.lineTo(sfbr2D.x + centerX, ((sfbr2D.y + centerY)/2 + centerY) ); 
      ctx.lineTo(sfbl2D.x + centerX, ((sfbl2D.y + centerY)/2 + centerY) ); 
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    }
    // Top
    if( ftl2btl*ftl2ftr ){
      ctx.beginPath(); 
      ctx.moveTo(sftl2D.x + centerX,    ((sftl2D.y + centerY)/2 + centerY) );
      ctx.lineTo(sbtl2D.x + centerX,   ((sbtl2D.y + centerY)/2 + centerY) ); 
      ctx.lineTo(sbtr2D.x + centerX, ((sbtr2D.y + centerY)/2 + centerY) );
      ctx.lineTo(sftr2D.x + centerX, ((sftr2D.y + centerY)/2 + centerY) ); 
      ctx.lineTo(sftl2D.x + centerX, ((sftl2D.y + centerY)/2 + centerY) ); 
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    }
    
    shadow.clearRect(0, 0, shadow.canvas.width, shadow.canvas.height);    
    shadow.drawImage( ctx.canvas, 0, 0);
    
  }
/*////////////////////////////////////////////////////////////////////////////
   Prism Function show(): Check what faces to show.
/////////////////////////////////////////////////////////////////////////// */   
  pcjsPrism3D.prototype.show = function(){
    var cPrism = this;
    
    if(cPrism.shadow){
      cPrism.showShadow();
    }
      
    if( cPrism.frontFace.isVisible() ){
      cPrism.frontFace.show();
    }else if( cPrism.backFace.isVisible() ){
      cPrism.backFace.show();
    }
    
    if( cPrism.topFace.isVisible() ){
      cPrism.topFace.show();
    }else if( cPrism.bottomFace.isVisible() ){
      cPrism.bottomFace.show();
    } 
    
    if( cPrism.rightFace.isVisible() ){
      cPrism.rightFace.show();
    }else if( cPrism.leftFace.isVisible() ){
      cPrism.leftFace.show();
    }
        
  }
/*////////////////////////////////////////////////////////////////////////////
   Prism Function clear():
/////////////////////////////////////////////////////////////////////////// */   
  pcjsPrism3D.prototype.clear = function(){
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }
/*////////////////////////////////////////////////////////////////////////////
   Prism Function translateTo3D():
/////////////////////////////////////////////////////////////////////////// */ 
  pcjsPrism3D.prototype.translateTo3D = function(X,Y,Z){
    var cPrism = this,
        dX = X - cPrism.position.x,
        dY = Y - cPrism.position.y,
        dZ = Z - cPrism.position.z;
        
    cPrism.position.x = X;
    cPrism.position.y = Y;
    cPrism.position.z = Z;
    
    for(var i =0;i<cPrism.points.length;i++){
      cPrism.points[i].translateBy3D(dX,dY,dZ);
    } 
    for(var i =0;i<cPrism.faces.length;i++){
      if(cPrism.faces[i].hasImage){
        cPrism.faces[i].updatePadding();
      }
    }
  }
/*////////////////////////////////////////////////////////////////////////////
   Prism Function translateBy3D():
/////////////////////////////////////////////////////////////////////////// */   
  pcjsPrism3D.prototype.translateBy3D = function(dX,dY,dZ){
    var cPrism = this;
    cPrism.position.x = cPrism.position.x + dX,
    cPrism.position.y = cPrism.position.y + dY,
    cPrism.position.z = cPrism.position.z + dZ

    for(var i =0;i<cPrism.points.length;i++){
      cPrism.points[i].translateBy3D(dX,dY,dZ);
    } 
    for(var i =0;i<cPrism.faces.length;i++){
      if(cPrism.faces[i].hasImage){
        cPrism.faces[i].updatePadding();
      }
    }    
  }
/*////////////////////////////////////////////////////////////////////////////
   Prism Function rotateTo3D():
/////////////////////////////////////////////////////////////////////////// */   
  pcjsPrism3D.prototype.rotateTo3D = function(thetaX,thetaY,thetaZ){
    var cPrism = this;
    // Angles in degrees
    var dAngleX = (thetaX+360)%360 - cPrism.angle.x,
        dAngleY = (thetaY+360)%360 - cPrism.angle.y,
        dAngleZ = (thetaZ+360)%360 - cPrism.angle.z;    
    cPrism.angle = {// Relative to x-y axis, positive z is out of screen
        x: thetaX,
        y: thetaY,
        z: thetaZ
    };
    for(var i =0;i<cPrism.points.length;i++){
      cPrism.points[i].rotateAboutBy3D(dAngleX,dAngleY,dAngleZ,cPrism.position);
    } 
    for(var i =0;i<cPrism.faces.length;i++){
      if(cPrism.faces[i].hasImage){
        cPrism.faces[i].updatePadding();
      }
    }    
  }
/*////////////////////////////////////////////////////////////////////////////
   Prism Function rotateBy3D():
/////////////////////////////////////////////////////////////////////////// */     
  pcjsPrism3D.prototype.rotateBy3D = function(dAngleX,dAngleY,dAngleZ){
    var cPrism = this;
    cPrism.angle = {// Relative to x-y axis, positive z is out of screen
        x: (cPrism.angle.x+dAngleX+360)%360,
        y: (cPrism.angle.y+dAngleY+360)%360,
        z: (cPrism.angle.z+dAngleZ+360)%360
    };
    for(var i =0;i<cPrism.points.length;i++){
      cPrism.points[i].rotateAboutBy3D(dAngleX,dAngleY,dAngleZ,cPrism.position);
    } 
    for(var i =0;i<cPrism.faces.length;i++){
      if(cPrism.faces[i].hasImage){
        cPrism.faces[i].updatePadding();
      }
    }  
  } 
/*////////////////////////////////////////////////////////////////////////////
   Prism Function animateBy():
/////////////////////////////////////////////////////////////////////////// */    
  pcjsPrism3D.prototype.animateBy = function(delta,time,easing,callbackFinish,callbackEach){    
    var go = {      
      x: this.position.x + delta.x,
      y: this.position.y + delta.y,
      z: this.position.z + delta.z,
      thetaX: this.angle.x + delta.thetaX,
      thetaY: this.angle.y + delta.thetaY,
      thetaZ: this.angle.z + delta.thetaZ
      };     
    this.animateTo(go,time,easing,callbackFinish,callbackEach);  
  }
/*////////////////////////////////////////////////////////////////////////////
   Prism Function animateTo():
/////////////////////////////////////////////////////////////////////////// */ 
  pcjsPrism3D.prototype.animateTo = function(destination,time,easing,callbackFinish,callbackEach){
    var prism = this;
    var prismEasing = '';

    if(easing){
      prismEasing = {
        x: (easing.x?easing.x:''),
        y: (easing.y?easing.y:''),
        z: (easing.z?easing.z:''),
        thetaX: (easing.thetaX?easing.thetaX:''),
        thetaY: (easing.thetaY?easing.thetaY:''),
        thetaZ: (easing.thetaZ?easing.thetaZ:'')
      };
    }
    var i = {
        x: prism.position.x,
        y: prism.position.y,
        z: prism.position.z,
        thetaX: prism.angle.x,
        thetaY: prism.angle.y,
        thetaZ: prism.angle.z,
        show: ''
    };
    s(i).animate({
      x: 0 + destination.x,
      y: 0 + destination.y,
      z: 0 + destination.z,
      thetaX: 0 + destination.thetaX,
      thetaY: 0 + destination.thetaY,
      thetaZ: 0 + destination.thetaZ,
      show: ''
    },
    { duration: (time?time:2000),
      specialEasing: prismEasing,
      step: function(now, fx) { //fx.prop
        if(fx.prop=="x"){
          prism.translateTo3D(now,prism.position.y,prism.position.z);
        }
        else if(fx.prop=="y"){
          prism.translateTo3D(prism.position.x,now,prism.position.z);
        }      
        else if(fx.prop=="z"){
          prism.translateTo3D(prism.position.x,prism.position.y,now);
        }
        else if(fx.prop=="thetaX"){
          prism.rotateTo3D(now,prism.angle.x,prism.angle.z);
        }      
        else if(fx.prop=="thetaY"){
          prism.rotateTo3D(prism.angle.x,now,prism.angle.z);
        }
        else if(fx.prop=="thetaZ"){
          prism.rotateTo3D(prism.angle.x,prism.angle.y,now);
        }      
        else if(fx.prop=="show"){
          if(callbackEach){
            callbackEach();
          }
          prism.clear();
          prism.show();
        }
      },
      complete: function(){
        if(callbackFinish){
          callbackFinish();
        }
      }
    });
  } 
  

///////////////////////////////////////////////////////////
/////////////////  SliceBox Object   //////////////////////
///////////////////////////////////////////////////////////
  function pcjsSliceBox3D(width, height, numSlices, args){
    this.width = width;
    this.height = height;
    
    if(args['shadow']){
      this.shadow = true;
      if(args['parent']){
        if(args['id']){
          this.canvasShadow = s('<canvas id="slice-shadow-'+args['id']+'" width='+args["parent"].width()+' height='+args["parent"].height()+' style="position:absolute;top:0px;z-index:-1"></canvas>');
          args["parent"].append(this.canvasShadow);
        }else{
          this.canvasShadow = s('<canvas id="slice-shadow" width='+args["parent"].width()+' height='+args["parent"].height()+' style="position:absolute;top:0px;z-index:-1"></canvas>');
          args["parent"].append(this.canvasShadow); 
        }
        this.ctxShadow = this.canvasShadow[0].getContext('2d');
      }else{
        this.canvasShadow = this.canvas;
        this.ctxShadow = this.ctx;
      }
    }
    if(args['background']){
      this.background = true;
      this.backgroundColor = (args['backgroundColor']?args['backgroundColor']:"#000");
    }

    this.crop = (args['crop']?true:false);
    this.shadow = (args['shadow']?true:false);
    this.perspective = (args['perspective']?args['perspective']:2000);
    this.background = (args['background']?true:false);
    this.backgroundColor = (args['backgroundColor']?args['backgroundColor']:'#000');
    
    this.slices = [];
    this.numSlices = numSlices;
    this.frontFaces = [];
    this.backFaces = [];
    this.topFaces = [];
    this.bottomFaces = [];
        
    this.activeFace = 0;
    this.nextFace = 1;
    this.prevFace = 3;

    for(var i=0;i<numSlices;i++){
      this.slices[i] = new pcjsSlice3D(width/numSlices,height,args);
      this.slices[i].translateBy3D(width*(1/numSlices*i-1/2+1/numSlices/2),0,0);
      this.frontFaces[i] = this.slices[i].frontFace;
      this.backFaces[i] = this.slices[i].backFace;
      this.topFaces[i] = this.slices[i].topFace;
      this.bottomFaces[i] = this.slices[i].bottomFace;
    } 
    
    this.order = [this.frontFaces,this.topFaces,this.backFaces,this.bottomFaces];
    this.slices[0].head = true;
    this.slices[numSlices-1].tail = true;
    
    this.activePos = 0;
    this.nextPos = 1;
    this.prevPos = 3;
    
    this.active = this.order[this.activePos];
    this.next = this.order[this.nextPos];
    this.prev = this.order[this.prevPos];
   

    this.canvas = s('<canvas id="header-slicebox" width='+args['parent'].width()+' height='+args['parent'].height()+' style="position:absolute;top:0px;z-index:-1"></canvas>');
    args['parent'].append(this.canvas);
    this.ctx = this.canvas[0].getContext('2d');
    
    var cover = s('<canvas id=cover-1 width='+args['parent'].width()+' height='+args['parent'].height()+' style="position:absolute;z-index:'+(numSlices+2)+';"></canvas>');
    args['parent'].append(cover);
    this.cover1 = cover[0].getContext('2d'); 
    
    cover = s('<canvas id=cover-2 width='+args['parent'].width()+' height='+args['parent'].height()+' style="position:absolute;z-index:'+(numSlices+2)+';"></canvas>');
    args['parent'].append(cover);
    this.cover2 = cover[0].getContext('2d');
    
    args['parent'] = s('<canvas id=cover-3 width='+args['parent'].width()+' height='+args['parent'].height()+' style="position:absolute;z-index:'+(numSlices+2)+';"></canvas>');
    args['parent'].append(cover);
    this.cover3 = cover[0].getContext('2d');
    
    
  }
/*////////////////////////////////////////////////////////////////////////////
   SliceBox Inherited Functions:
/////////////////////////////////////////////////////////////////////////// */   
  pcjsSliceBox3D.prototype.forward = pcjsPrism3D.prototype.forward;
  pcjsSliceBox3D.prototype.back = pcjsPrism3D.prototype.back;
/*////////////////////////////////////////////////////////////////////////////
   SliceBox Function show():
/////////////////////////////////////////////////////////////////////////// */ 
  pcjsSliceBox3D.prototype.show = function(){
    this.updateIndex();
    for(var i=0;i<this.slices.length;i++){
      this.slices[i].show();
    }
    this.cover(this.active,'all',this.cover1);
  }
/*////////////////////////////////////////////////////////////////////////////
   SliceBox Function updateIndex():
/////////////////////////////////////////////////////////////////////////// */ 
  pcjsSliceBox3D.prototype.updateIndex = function(){
    var distances = [];
    var theSlices = [];
    
    for(var i=0;i<this.slices.length;i++){
      distances[i] = Math.sqrt(this.slices[i].position.x*this.slices[i].position.x+this.slices[i].position.y*this.slices[i].position.y) + i*0.0001;
      theSlices[distances[i]] = this.slices[i]; 
    }
    distances.sort(function(a,b){return b-a});
    
    for(var i=0;i<distances.length;i++){
      theSlices[distances[i]].ctx.canvas.style.zIndex = i;
    }
  }
/*////////////////////////////////////////////////////////////////////////////
   SliceBox Function clear():
/////////////////////////////////////////////////////////////////////////// */ 
  pcjsSliceBox3D.prototype.clear = function(ctx){
    if(ctx){
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }else{
      this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
  }
/*////////////////////////////////////////////////////////////////////////////
   SliceBox Function cover(): To create the illusion of the slices coming
        back together into a single prism, cover with single plane.
        
        TODO: Perhaps overhang issue can be solved by another plane that
        includes the imageless slices
/////////////////////////////////////////////////////////////////////////// */ 
  pcjsSliceBox3D.prototype.cover = function(theFaces,start,ctx){
    if(theFaces&&start&&ctx){
      var sliceBox = this;
      var sx=0,sy=0,sh=0,sw=0,h=0,w=0;
      var pcjsImage;
      var imageCover = [];
      var backgroundCover = [];
      
      if(start=='head'){
        for(var i=0;i<sliceBox.numSlices;i++){
          if(theFaces[i].hasImage&&(!sliceBox.slices[i].moving)&&(!sliceBox.slices[i].begun)){    
            imageCover.push(i);
          }else if(theFaces[i].hasImage){
            break;
          }
        }
        for(var i=0;i<sliceBox.numSlices;i++){
          if((!sliceBox.slices[i].moving)&&(!sliceBox.slices[i].begun)){
            backgroundCover.push(i);
          }else{
            break;
          }
        }        
      }
      else if(start=='tail'){
        for(var i=sliceBox.numSlices-1;i>=0;i--){
          if(theFaces[i].hasImage&&(!sliceBox.slices[i].moving)&&(!sliceBox.slices[i].begun)){            
            imageCover.unshift(i);
          }else if(theFaces[i].hasImage){
            break;
          }
        }
        for(var i=sliceBox.numSlices-1;i>=0;i--){
          if((!sliceBox.slices[i].moving)&&(sliceBox.slices[i].begun)){
            backgroundCover.unshift(i);
          }
          else{
            break;
          }
        }        
      }
      else if(start=='center'){
        for(var i=0;i<sliceBox.numSlices;i++){
          if(!theFaces[i].hasImage){
            continue;
          }
          else if(theFaces[i].hasImage&&(!sliceBox.slices[i].moving)&&(sliceBox.slices[i].begun)){            
            imageCover.push(i);
          }
          else if(imageCover.length){
            break;
          }
        }
        for(var i=0;i<sliceBox.numSlices;i++){
          if((!sliceBox.slices[i].moving)&&(sliceBox.slices[i].begun)){
            backgroundCover.push(i);
          }
          else if(backgroundCover.length){
            break;
          }
        }
      }
      else if(start=='all'){
        for(var i=0;i<sliceBox.numSlices;i++){
          if(theFaces[i].hasImage&&(!sliceBox.slices[i].moving)&&(!sliceBox.slices[i].begun)){            
            imageCover.push(i);
          }
          if((!sliceBox.slices[i].moving)&&(!sliceBox.slices[i].begun)){
            backgroundCover.push(i);
          }
        }
      }
      
      if(backgroundCover.length){
        for(var i=0;i<backgroundCover.length;i++){
          w += theFaces[backgroundCover[i]].width;
        }
        h = theFaces[backgroundCover[0]].height;
        var args ={ctx:ctx,background:theFaces[backgroundCover[0]].background,backgroundColor:theFaces[backgroundCover[0]].backgroundColor};
        var cover = new pcjsPlane3D(w,h,args);
        var midpoint = theFaces[backgroundCover[0]].position.midPoint(theFaces[backgroundCover[backgroundCover.length-1]].position);
        cover.translateBy3D(midpoint.x,midpoint.y,midpoint.z);
        cover.show();
      }
      
      if(imageCover.length&&theFaces[imageCover[0]].hasImage){
        w=0;
        h=0;
        sx = ((theFaces[imageCover[0]].imgAdjust.sx>=0)?theFaces[imageCover[0]].imgAdjust.sx:0);
        sy = ((theFaces[imageCover[0]].imgAdjust.sy>=0)?theFaces[imageCover[0]].imgAdjust.sy:0);
        sh = ((theFaces[imageCover[0]].imgAdjust.sh>=0)?theFaces[imageCover[0]].imgAdjust.sh:theFaces[imageCover[0]].img.height);
        h = theFaces[imageCover[0]].height;
        
        var right = theFaces[imageCover[0]].imgPadding.right;
        var left = theFaces[imageCover[0]].imgPadding.left;
        var top = theFaces[imageCover[0]].imgPadding.top;
        var bottom = theFaces[imageCover[0]].imgPadding.bottom;
        
        for(var i=0;i<imageCover.length;i++){
          sw += theFaces[imageCover[i]].imgAdjust.sw;
          w += theFaces[imageCover[i]].width;
        }

        sw = (sw>=0?sw:theFaces[imageCover[0]].img.width);
        var args ={ctx:ctx,crop:theFaces[imageCover[0]].crop,background:theFaces[imageCover[0]].background,backgroundColor:theFaces[imageCover[0]].backgroundColor};
        var cover = new pcjsPlane3D(w,h,args);
        
        var midpoint = theFaces[imageCover[0]].position.midPoint(theFaces[imageCover[imageCover.length-1]].position);
        cover.translateBy3D(midpoint.x,midpoint.y,midpoint.z);

        if(theFaces[imageCover[0]].hasImage){
          cover.addImageOnly(theFaces[imageCover[0]].img);     
          cover.adjustImage(sx,sy,sw,sh);
        }
        cover.show();
      }
    }
  }
/*////////////////////////////////////////////////////////////////////////////
   SliceBox Function addImage(): When adding images to slices, 
        determine which slices get an image and how they should 
        be adjusted.
/////////////////////////////////////////////////////////////////////////// */   
  pcjsSliceBox3D.prototype.addImage = function(faces,pcjsImg){
    if(faces&&pcjsImg){
      var sliceBox = this,
          lessImageW = 0,
          head = 0,
          tail = this.numSlices-1,
          excessH = 0, excessW = 0, // To be cropped
          lessH =0, lessW = 0; // To be padded
      
      for(var i=0;i<faces.length;i++){
        faces[i].removeImage();
      }   

      if((pcjsImg.width/pcjsImg.height)>=(sliceBox.width/sliceBox.height)){
        if(pcjsImg.width<sliceBox.width){
          lessW = sliceBox.width - pcjsImg.width;
        }else{
          if(sliceBox.crop){
            excessW = pcjsImg.width - pcjsImg.height*this.width/this.height;
          }else{
            // Image is wide, nothing special needed
          }
        }
      }      
      else if((pcjsImg.width/pcjsImg.height)<(sliceBox.width/sliceBox.height)){
        if(pcjsImg.height<sliceBox.height){
          lessW = sliceBox.width - pcjsImg.width;
        }else{
          if(sliceBox.crop){
            lessW = sliceBox.width - pcjsImg.width;
            lessW = (lessW>=0?lessW:0);
            excessH = pcjsImg.height - pcjsImg.width*sliceBox.height/(sliceBox.width-lessW);
          }else{
            lessW = Math.abs(pcjsImg.width - sliceBox.width/sliceBox.height*pcjsImg.height); // Must be in terms of source width
          }
          
        }
      }
      
      lessW = Math.abs(lessW); // just to be sure

      if(lessW){
        var left = lessW/2;
        var imgSliceWidth = Math.abs((pcjsImg.width+lessW)/sliceBox.numSlices);
        var catcher = sliceBox.numSlices*2;
        while(left>0&&catcher>0){
          catcher--;
          if(left>imgSliceWidth){
            left -= imgSliceWidth;
            head++;
            tail--;
          }else{     
            if(head==tail){
              var reducedWidth = Math.abs(imgSliceWidth-left*2);
              faces[head].addImageOnly(pcjsImg);
              faces[head].adjustImage(0,excessH/2,reducedWidth,pcjsImg.height-excessH);     
              left -= imgSliceWidth;
              head++;
              tail--;
            }
            else{
              var reducedWidth = Math.abs(imgSliceWidth-left);
              var sxTail = Math.abs(imgSliceWidth*Math.abs(tail-head-1)+reducedWidth);
              faces[head].addImageOnly(pcjsImg);
              faces[head].adjustImage(0,excessH/2,reducedWidth,pcjsImg.height-excessH,'left-side');
              faces[tail].addImageOnly(pcjsImg);
              faces[tail].adjustImage(sxTail,excessH/2,reducedWidth,pcjsImg.height-excessH,'right-side');          
              left -= imgSliceWidth;
              head++;
              tail--;
            } 
          }
        }
        for(var i=head;i<=tail;i++){
          var sxCurrent = Math.abs(imgSliceWidth*i-lessW/2);
          faces[i].addImageOnly(pcjsImg);
          faces[i].adjustImage(sxCurrent,excessH/2,imgSliceWidth,pcjsImg.height-excessH);
        }
      }
      else if(excessW){
        for(var i = head;i<=tail;i++){
          faces[i].addImageOnly(pcjsImg);
          faces[i].adjustImage((pcjsImg.width-excessW)/sliceBox.numSlices*i+excessW/2,excessH/2,(pcjsImg.width-excessW)/sliceBox.numSlices,pcjsImg.height-excessH);
        }
      }
      else if(excessH){
        for(var i = head;i<=tail;i++){
          faces[i].addImageOnly(pcjsImg);
          faces[i].adjustImage(pcjsImg.width/sliceBox.numSlices*i,excessH/2,pcjsImg.width/sliceBox.numSlices,pcjsImg.height-excessH);
        }
      }
      else{
        // Image is wide
        for(var i = head;i<=tail;i++){
          faces[i].addImageOnly(pcjsImg);
          faces[i].adjustImage(pcjsImg.width/sliceBox.numSlices*i,excessH/2,pcjsImg.width/sliceBox.numSlices,pcjsImg.height-excessH);
        }
      }
      
    }
  }
/*////////////////////////////////////////////////////////////////////////////
   SliceBox Function translateBy3D(): 
/////////////////////////////////////////////////////////////////////////// */
  pcjsSliceBox3D.prototype.translateBy3D = function(dX,dY,dZ){
    for(var i=0;i<this.slices.length;i++){
      this.slices[i].translateBy3D(dX,dY,dZ);
    }
  }

/////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////  SliceBox Animations   /////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
  pcjsSliceBox3D.prototype.animateDrop = function(time,by){
    var sliceBox = this;
    var excessW = sliceBox.width/20;
    if(by=='back'){
      var angle=-90;
    }else{
      var angle=90;
    }
    if(!time){time = 5000;}

    s.each(sliceBox.slices, function(i){
      var go,easing,
          current = this,
          normal = ((sliceBox.numSlices-1)/2 - i)/((sliceBox.numSlices-1)/2),
          magnitude = Math.abs(normal);  
      current.begun = false;
      setTimeout(function(){   
        sliceBox.clear(sliceBox.cover2);
        sliceBox.clear(sliceBox.cover3); 
        if(by=='back'){
          sliceBox.cover(sliceBox.next,'tail',sliceBox.cover2);
          sliceBox.cover(sliceBox.next,'head',sliceBox.cover3);           
        }else{
          sliceBox.cover(sliceBox.prev,'tail',sliceBox.cover2);
          sliceBox.cover(sliceBox.prev,'head',sliceBox.cover3);
        }
        sliceBox.clear(sliceBox.cover1); 
        
        // Animation ONE    
        go = {x:-excessW*4*normal,y:0,z:-current.depth*5,thetaX:0,thetaY:0,thetaZ:0};
        easing = {x: 'easeInQuad',z: 'easeOutBounce'};
        current.begun = true;
        current.moving = true;
        current.animateBy(go,time*1/2+(i%2)*(1-magnitude)*time/20,easing,
          function(){ // Callback  
            // Animation Two        
            go = {x:excessW*4*normal,y:0,z:current.depth*5,thetaX:angle,thetaY:0,thetaZ:0};
            easing = {thetaX: 'easeOutQuint',x: 'easeOutExpo',z: 'easeOutBounce'};
            current.animateBy(go,time*4/10+time/10*magnitude,easing,
              function(){ // Callback        
                current.moving = false;
                sliceBox.clear(sliceBox.cover1);
                sliceBox.cover(sliceBox.active,'center',sliceBox.cover1);
              }
            );
          }
        );
      },time/10*magnitude-(i%2)*(1-magnitude)*time/20 ); 
    });
  }

  pcjsSliceBox3D.prototype.animateQuick = function(time,by){
    var sliceBox = this;
    if(by=='back'){
      var angle=-90;
    }else{
      var angle=90;
    }
    if(!time){time = 2000;}
    
    s.each(sliceBox.slices, function(i){
      var go,easing,
          current = this,
          normal = ((sliceBox.numSlices-1)/2 - i)/((sliceBox.numSlices-1)/2),
          magnitude = Math.abs(normal);
      current.begun = false;
      setTimeout(function(){  
        sliceBox.clear(sliceBox.cover2);
        sliceBox.clear(sliceBox.cover3);              
        if(by=='back'){
          sliceBox.cover(sliceBox.next,'tail',sliceBox.cover2);
          sliceBox.cover(sliceBox.next,'head',sliceBox.cover3);           
        }else{
          sliceBox.cover(sliceBox.prev,'tail',sliceBox.cover2);
          sliceBox.cover(sliceBox.prev,'head',sliceBox.cover3);
        }
        sliceBox.clear(sliceBox.cover1);
        // Animation ONE    
        go = {x:0,y:0,z:-current.depth*2,thetaX:angle/3,thetaY:0,thetaZ:0};
        easing = {thetaX: 'easeInQuad'};
        current.begun = true;
        current.moving = true;
        current.animateBy(go,time/4+magnitude*time/8,easing,
          function(){ // Callback
            // Animation TWO        
            go = {x:0,y:0,z:current.depth*2,thetaX:angle*2/3,thetaY:0,thetaZ:0};
            easing = {thetaX: 'easeOutQuad'};
            current.animateBy(go,time/2,easing,
              function(){ // Callback       
                current.moving = false;
                sliceBox.cover(sliceBox.active,'center',sliceBox.cover1);
              }
            );
          }
        );
      },magnitude*time/8);
    });
  }

  pcjsSliceBox3D.prototype.animateTip = function(time,by){
    var sliceBox = this,angleOne,angleTwo;
    var excessW = (sliceBox.ctx.canvas.width-sliceBox.width)/3;
    if(by=='back'){
      angleOne = -45;
      angleTwo = -45;
    }else{
      angleOne = -30;
      angleTwo = 120;
    }
    if(!time){time = 4000;}
    
    sliceBox.clear(sliceBox.cover1);
    sliceBox.clear(sliceBox.cover2);
    sliceBox.clear(sliceBox.cover3);
    
    s.each(this.slices, function(i){
      var go,easing,
          current = this,
          normal = ((sliceBox.numSlices-1)/2 - i)/((sliceBox.numSlices-1)/2),
          magnitude = Math.abs(normal),
          order = (i+1)/sliceBox.numSlices;        

      // Animation ONE        
      go = {x:-excessW*normal-normal*10,y:0,z:-current.depth*5,thetaX:angleOne,thetaY:0,thetaZ:0};
      easing = {thetaX: 'easeInBack',x: 'easeOutQuad'};
      current.begun = true;
      current.moving = true;
      current.animateBy(go,time/5 + order*time/5,easing,
        function(){ // Callback
          // Animation Two        
          go = {x:-excessW*normal/4,y:0,z:0,thetaX:angleTwo,thetaY:0,thetaZ:0};
          easing = {thetaX: 'easeOutBounce',x: 'easeInQuad'};
          current.animateBy(go,time/5 + time/10,easing,
            function(){ // Callback
              // Animation Three
              go = {x:excessW*normal*5/4,y:0,z:0,thetaX:0,thetaY:0,thetaZ:0};
              easing = {thetaX: 'easeOutExpo',x: 'easeInQuad'};
              current.animateBy(go,time/10,easing,
                function(){ // Callback
                  // Animation Four
                  go = {x:normal*10,y:0,z:current.depth*5,thetaX:0,thetaY:0,thetaZ:0};
                  easing = {thetaX: 'easeOutExpo',x: 'easeInQuad'};
                  current.animateBy(go,time/5,easing,
                    function(){ // Callback
                      current.moving = false;
                      sliceBox.clear(sliceBox.cover1);
                      sliceBox.cover(sliceBox.active,'center',sliceBox.cover1);
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  }
  
  pcjsSliceBox3D.prototype.animateSwing = function(time,by){
    var sliceBox = this,angleOne,angleTwo;
    var excessW = (sliceBox.ctx.canvas.width-sliceBox.width)/3;
    if(by=='back'){
      angle = -90;
    }else{
      angle = 90;
    }
    if(!time){time = 4000;}
    
    sliceBox.clear(sliceBox.cover1);
    sliceBox.clear(sliceBox.cover2);
    sliceBox.clear(sliceBox.cover3);
    
    s.each(this.slices, function(i){
      var go,easing,
          current = this,
          normal = ((sliceBox.numSlices-1)/2 - i)/((sliceBox.numSlices-1)/2),
          magnitude = Math.abs(normal),
          order = (i+1)/sliceBox.numSlices;        

      // Animation ONE    
      go = {x:-normal*10,y:0,z:-current.depth*2,thetaX:angle/2,thetaY:0,thetaZ:0};
      easing = {thetaX: 'easeInBack',z: 'easeOutBack'};
      current.begun = true;
      current.moving = true;
      current.animateBy(go,time/4 + order*time/2,easing,
        function(){ // Callback
          // Animation TWO
          go = {x:normal*10,y:0,z:current.depth*2,thetaX:angle/2,thetaY:0,thetaZ:0};
          easing = {thetaX: 'easeOutBack',x: 'easeInQuad'};
          current.animateBy(go,time/4,easing,
            function(){ // Callback
              current.moving = false;
              sliceBox.clear(sliceBox.cover1);
              sliceBox.cover(sliceBox.active,'center',sliceBox.cover1);
            }
          );
        }
      );
    });
  }
  pcjsSliceBox3D.prototype.animateBounce = function(time,by){
    var sliceBox=this,angle;
    var excessW = sliceBox.width/20;
    if(by=='back'){
      angle = -90;
    }else{
      angle = 90;
    }
    if(!time){time = 3000;}

    sliceBox.clear(sliceBox.cover1);
    sliceBox.clear(sliceBox.cover2);
    sliceBox.clear(sliceBox.cover3);
    
    s.each(this.slices, function(i){
      var go,easing,
          current = this,
          normal = ((sliceBox.numSlices-1)/2 - i)/((sliceBox.numSlices-1)/2),
          magnitude = Math.abs(normal),
      // Animation ONE    
      go = {x:-excessW*normal*4,y:0,z:-current.depth*3*(magnitude+1),thetaX:angle/2,thetaY:0,thetaZ:0};
      easing = {thetaX: 'easeInCubic',x: 'easeOutBounce',z: 'easeOutCubic'};
      current.begun = true;
      current.moving = true;
      current.animateBy(go,time/4+time/4*magnitude,easing,
        function(){ // CallbackFinish
          // Animation TWO        
          go = {x:excessW*normal*4,y:0,z:current.depth*3*(magnitude+1),thetaX:angle/2,thetaY:0,thetaZ:0};
          easing = {thetaX: 'easeOutCubic',x: 'easeInQuad',z: 'easeInQuad'};
          current.animateBy(go,time/4+time/4*magnitude,easing,
            function(){ // CallbackFinish       
              current.moving = false;
              sliceBox.clear(sliceBox.cover1);
              sliceBox.cover(sliceBox.active,'center',sliceBox.cover1);
            }
          );
        }
      );
    });
  }

  /////////////////////////////////////////////////////////
  ///////////////      Slice Object     ///////////////////
  /////////////////////////////////////////////////////////
  pcjsSlice3D.prototype = pcjsPrism3D;
  pcjsSlice3D.prototype.constructor = pcjsSlice3D;
  function pcjsSlice3D(width, height, args){
    pcjsPrism3D.call(this, width, height, height, args);

    this.borderColorMoving = (args['borderColor']?args['borderColor']:'#fff');
    this.borderColorStopped = (args['backgroundColor']?args['backgroundColor']:'#000');
    this.head = false;
    this.tail = false;
    this.moving = false;
    this.begun = false;
  }
/*////////////////////////////////////////////////////////////////////////////
   Slice Inherited Functions:
/////////////////////////////////////////////////////////////////////////// */
  pcjsSlice3D.prototype.translateBy3D = pcjsPrism3D.prototype.translateBy3D;
  pcjsSlice3D.prototype.translateTo3D = pcjsPrism3D.prototype.translateTo3D;
  pcjsSlice3D.prototype.rotateTo3D = pcjsPrism3D.prototype.rotateTo3D;
  pcjsSlice3D.prototype.clear = pcjsPrism3D.prototype.clear;
  pcjsSlice3D.prototype.show = pcjsPrism3D.prototype.show;
  pcjsSlice3D.prototype.showShadow = pcjsPrism3D.prototype.showShadow;
  pcjsSlice3D.prototype.animateTo = pcjsPrism3D.prototype.animateTo; 
  pcjsSlice3D.prototype.animateBy = pcjsPrism3D.prototype.animateBy; 

/*////////////////////////////////////////////////////////////////////////////
   Default plugin options:
/////////////////////////////////////////////////////////////////////////// */

  s.fn.PhotoCubeJS.options = {
    imageListClass : 'cube-img-list',
    style: "cube",
    special: "cube_rot_x",
    width: 1.85,
    height: 1,
    reduce: 100,
    shadow: 1,
    background:'#000',
    crop: 0,
    numSlices: 10,
    navHover: 1,
    delay: 5000,
    time: 2000,
    auto: 1,
    playPause: 1,
    startPaused: 0,
    imageLink: 1,
    postTitle: 0,
    postExcerpt: 0,
    interval: 20,
  }
})( window, jQuery );
