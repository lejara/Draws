/************************************************************************
 *
 * Author By Marijn Haverbeke
 * Comments By: Ryan Boone, falldowngoboone@gmail.com
 * Modifications By: Lejara (Leption)
 * 
 ***********************************************************************/

//TODO: try to make strokes smoother

var canvus_Width = 700; // Note: make sure to update css width in paint-app
var canvus_height = 400;
var cx;
// the core of the program; appends the paint interface to the
// DOM element given as an argument (parent)
function createPaint(parent) {
    var canvas = elt('canvas', {width: canvus_Width, height: canvus_height, style: "cursor: crosshair;"});
    cx = canvas.getContext('2d');
    var toolbar = elt('div', {class: 'toolbar'});
    
    // calls the every function in controls, passing in context,
    // then appending the returned results to the toolbar
    for (var name in controls)
      toolbar.appendChild(controls[name](cx));
    
    var panel = elt('div', {class: 'picturepanel'}, canvas);
    parent.appendChild(elt('div', null, panel, toolbar));
  }
  
  /************************************************************************
   * helper functions
   ***********************************************************************/
  
  // creates an element with a name and object (attributes)
  // appends all further arguments it gets as child nodes
  // string arguments create text nodes
  // ex: elt('div', {class: 'foo'}, 'Hello, world!');
  function elt(name, attributes) {
    var node = document.createElement(name);
    if (attributes) {
      for (var attr in attributes)
        if (attributes.hasOwnProperty(attr))
          node.setAttribute(attr, attributes[attr]);
    }
    for (var i = 2; i < arguments.length; i++) {
      var child = arguments[i];
      
      // if this argument is a string, create a text node
      if (typeof child == 'string')
        child = document.createTextNode(child);
      node.appendChild(child);
    }
    return node;
  }
  
  // figures out canvas relative coordinates for accurate functionality
  function relativePos(event, element) {
    var rect = element.getBoundingClientRect();
    return {x: Math.floor(event.clientX - rect.left),
            y: Math.floor(event.clientY - rect.top)};
  }
  
  // registers and unregisters listeners for tools
  function trackDrag(onMove, onEnd) {
    function end(event) {
      removeEventListener('mousedown', onMove);
      removeEventListener('mousemove', onMove);
      removeEventListener('mouseup', end);
      if (onEnd)
        onEnd(event);
    }
    addEventListener('mousedown', onMove);
    addEventListener('mousemove', onMove);
    addEventListener('mouseup', end);
  }
  
  // loads an image from a URL and replaces the contents of the canvas
  function loadImageURL(cx, url)  {
    var image = document.createElement('img');
    image.addEventListener('load', function() {
      var color = cx.fillStyle, size = cx.lineWidth;
      cx.canvas.width = image.width;
      cx.canvas.height = image.height;
      cx.drawImage(image, 0, 0);
      cx.fillStyle = color;
      cx.strokeStyle = color;
      cx.lineWidth = size;
    });
    image.src = url;
  }
  
  // used by tools.Spray
  // randomly positions dots
  function randomPointInRadius(radius) {
    for (;;) {
      var x = Math.random() * 2 - 1;
      var y = Math.random() * 2 - 1;
      // uses the Pythagorean theorem to test if a point is inside a circle
      if (x * x + y * y <= 1)
        return {x: x * radius, y: y * radius};
    }
  }
  
  /************************************************************************
   * controls
   ***********************************************************************/
  
  // holds static methods to initialize the various controls;
  // Object.create() is used to create a truly empty object
  var controls = Object.create(null);

  controls.tool = function(cx) {
    var select = elt('div', {style: 'font-size: 1.7rem;'});
    var labels_class = ['fas fa-paint-brush', 'fas fa-eraser', 'fad fa-eraser', 'fas fa-fill-drip']
    // populate the tools
    var ctr = 0;
    for (var name in tools){
      if(ctr === 0){
        select.appendChild(elt('input', {class: 'tools_radio', type: 'radio', id: (name+ctr), name: "tools_radio", value: name, checked: 'checked'}, name));
      }else{
        select.appendChild(elt('input', {class: 'tools_radio', type: 'radio', id: (name+ctr), name: "tools_radio", value: name}, name));
      }
      select.appendChild(elt('label', {class: 'tools_radio', for: (name+ctr)}, elt('i', {class: labels_class[ctr]})))
      ctr++;
    }
      
    // calls the particular method associated with the current tool
    cx.canvas.addEventListener('mousedown', function(event) {
      
      // is the left mouse button being pressed?
      if (event.which == 1) {
        
        // the event needs to be passed to the method to determine
        // what the mouse is doing and where it is
        
        var selected_value;
        var tools_radios =  document.querySelectorAll('input[name="tools_radio"]');
        for(const tool_r of tools_radios){
          if(tool_r.checked){
            selected_value = tool_r.value;
            break;
          }
        }
        tools[selected_value](event, cx);
        // don't select when user is clicking and dragging
        event.preventDefault();
      }
    });
    
    return elt('span', null, select);
  };
  
  // color module
  controls.color = function(cx) {
    
    var c_box_black = elt('div', {class: 'col-1 colour_box', id: 'c_black', style: 'background-color:#000000', 'data-color': '#000000', onclick: 'colour_box.call(this);'});
    var c_box_white = elt('div', {class: 'col-1 colour_box', id: 'c_black', style: 'background-color:#FFFFFF', 'data-color': '#FFFFFF', onclick: 'colour_box.call(this);'});
    var c_box_red = elt('div', {class: 'col-1 colour_box', id: 'c_black', style: 'background-color:#ff0000', 'data-color': '#ff0000', onclick: 'colour_box.call(this);'});
    var c_box_blue = elt('div', {class: 'col-1 colour_box', id: 'c_black', style: 'background-color:#0000ff', 'data-color': '#0000ff', onclick: 'colour_box.call(this);'});

    return elt('span', null, c_box_black, c_box_white, c_box_red, c_box_blue);
  };

  var colour_box = function(){
    cx.fillStyle = this.dataset.color;
    cx.strokeStyle = this.dataset.color;
  }

  //Erase All module
  controls.allErase = function(cx){
    var button = elt('i', {class: 'erase-all fas fa-trash'});

    button.addEventListener("click", function(){
        cx.globalCompositeOperation = 'destination-out';
        cx.fillRect(0, 0, canvus_Width, canvus_height);
        cx.globalCompositeOperation = 'source-over';
    })

    return elt('span', null, button);
  }
  
  // brush size module
  controls.brushSize = function(cx) {
    var select = elt('div', {style: 'font-size: 0.6rem;'});
    
    // various brush sizes
    var sizes = [4, 8, 12, 30];
    var labels_class = ['fas fa-circle fa-sm', 'fas fa-circle fa-lg', 'fas fa-circle fa-2x', 'fas fa-circle fa-3x']
    // build up a select group of size options
    var ctr = 0;
    sizes.forEach(function(size) {
      // select.appendChild(elt('option', {value: size}, size + ' pixels'));
      var element;
      if(ctr === 0){
        element = elt('input', {class: 'size_radio', type: 'radio', id: ("size"+size+ctr), name: ("size"), value: size, checked: 'checked'})
        select.appendChild(element);
      }else{
        element = elt('input', {class: 'size_radio', type: 'radio', id: ("size"+size+ctr), name: ("size"), value: size})
        select.appendChild(element);
      }
      // on change, set the new stroke thickness
      element.addEventListener('click', function(event) {
        cx.lineWidth = event.target.value;
      });

      select.appendChild(elt('label', {class: 'size_radio', for: ("size"+size+ctr)}, elt('i', {class: labels_class[ctr]})))
      ctr++;
    });

    cx.lineWidth = sizes[0];

    return elt('span', null, select);
  };
  
  
  /************************************************************************
   * tools
   ***********************************************************************/
  
  // drawing tools
  var tools = Object.create(null);
  
  // line tool
  // onEnd is for the erase function, which uses it to reset
      // the globalCompositeOperation to source-over
  tools.Line = function(event, cx, onEnd) {
    cx.lineCap = 'round';
    
    // mouse position relative to the canvas
    var pos = relativePos(event, cx.canvas);
    trackDrag(function(event) {
      cx.beginPath();
      
      // move to current mouse position
      cx.moveTo(pos.x, pos.y);
      
      // update mouse position
      pos = relativePos(event, cx.canvas);
      
      // line to updated mouse position
      cx.lineTo(pos.x, pos.y);
      
      // stroke the line
      cx.stroke();
    }, onEnd);
  };
  
  // erase tool
  tools.Erase = function(event, cx) {
    
    // globalCompositeOperation determines how drawing operations
    // on a canvas affect what's already there
    // 'destination-out' makes pixels transparent, 'erasing' them
    // NOTE: this has been deprecated
    cx.globalCompositeOperation = 'destination-out';
    tools.Line(event, cx, function() {
      cx.globalCompositeOperation = 'source-over';
    });
  };
  

  
  /************************************************************************
   * exercises
   ***********************************************************************/
  
  /**
   * allows the user to click and drag out a rectangle on the canvas
   *
   * @param {Object} event - mousedown event (specifically left button)
   * @param {Object} cx - the canvas 2d context object
   */
  tools.Rectangle = function(event, cx) {
    var leftX, rightX, topY, bottomY
    var clientX = event.clientX,
        clientY = event.clientY;
    
    // placeholder rectangle
    var placeholder = elt('div', {class: 'placeholder'});
    
    // cache the relative position of mouse x and y on canvas
    var initialPos = relativePos(event, cx.canvas);
    
    // used for determining correct placeholder position
    var xOffset = clientX - initialPos.x,
        yOffset = clientY - initialPos.y;
    
    trackDrag(function(event) {
      document.body.appendChild(placeholder);
      
      var currentPos = relativePos(event, cx.canvas);
      var startX = initialPos.x,
          startY = initialPos.y;
          
      // assign leftX, rightX, topY and bottomY
      if (startX < currentPos.x) {
        leftX = startX;
        rightX = currentPos.x;
      } else {
        leftX = currentPos.x;
        rightX = startX;
      }
  
      if (startY < currentPos.y) {
        topY = startY;
        bottomY = currentPos.y;
      } else {
        topY = currentPos.y;
        bottomY = startY;
      }
    
        // set the style to reflect current fill
      placeholder.style.background = cx.fillStyle;
      
        // set div.style.left to leftX, width to rightX - leftX
      placeholder.style.left = leftX + xOffset + 'px';
      placeholder.style.top = topY + yOffset + 'px';
      placeholder.style.width = rightX - leftX + 'px';
      placeholder.style.height = bottomY - topY + 'px';	
    }, function() {
      
      // add rectangle to canvas with leftX, rightX, topY and bottomY
      cx.fillRect(leftX, topY, rightX - leftX, bottomY - topY);
      
        // destroy placeholder
      document.body.removeChild(placeholder);
    });
  };
  
  
  // helpers for flood fill
  
  // iterates over N, S, E and W neighbors and performs a function fn
  function forEachNeighbor(point, fn) {
    fn({x: point.x - 1, y: point.y});
    fn({x: point.x + 1, y: point.y});
    fn({x: point.x, y: point.y - 1});
    fn({x: point.x, y: point.y + 1});
  }
  
  // checks if 2 points in data, point1 and point2, have the same color
  function isSameColor(data, point1, point2) {
    var offset1 = (point1.x + point1.y * data.width) * 4;
    var offset2 = (point2.x + point2.y * data.width) * 4;
    
    for (var i = 0; i < 4; i++) {
      if (data.data[offset1 + i] != data.data[offset2 + i]) {
        return false;
      }
    }
    return true;
  }
  
  // end flood fill helpers
  
  // NOTE: in my first attempt, I was creating Pixel objects and pushing them
  // to isPainted instead of Booleans; that wasn't a great idea...
  // I suspect there was too much initialization for the browser to handle
  // and it choked fatally :(
  
  // I think I would still like to see this done with a Pixel object, if not
  // merely for the ability to extend it to done some more advanced things
  
  /**
   * paints all adjacent matching pixels
   */
  tools["Flood Fill"] = function(event, cx) {
    var imageData = cx.getImageData(0, 0, cx.canvas.width, cx.canvas.height),
        // get sample point at current position, {x: int, y: int}
            sample = relativePos(event, cx.canvas),
        isPainted = new Array(imageData.width * imageData.height),
        toPaint = [sample];
    
    // while toPaint.length > 0
    while(toPaint.length) {
      // current point to check
      var current = toPaint.pop(),
          id = current.x + current.y * imageData.width;
      
      // check if current has already been painted
      if (isPainted[id]) continue;
      else {
        
        // if it hasn't, paint current and set isPainted to true
        cx.fillRect(current.x, current.y, 1, 1);
        isPainted[id] = true;
      }
      
      // for every neighbor (new function)
      forEachNeighbor(current, function(neighbor) {
        if (neighbor.x >= 0 && neighbor.x < imageData.width &&
            neighbor.y >= 0 && neighbor.y < imageData.height &&
            isSameColor(imageData, sample, neighbor)) {
          toPaint.push(neighbor);
        }
      });
    }
  };
  
  // initialize the app

  $(document).ready(function() {
    var appDiv = document.querySelector('#paint-app');
    console.log(appDiv);
    createPaint(appDiv);

  })
