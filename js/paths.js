//paths.js
//create circuit board like designs

//global object
PA = {
	'export': '',
	parameters: {
		dimension: {
			w: 320,
			h: 320},
		cell_size: 16,
		line_width: 3,
		line_colour: 'blue'}
	};

PA.drawBiline = function( x , y ) {
	var p, dir, line1_points, line2_points, biline_points;

	// create head point
	p = { 'x': x, 'y': y };

	// see if starting point is availabe
	if ( !PA.pointIsAvailable( p ) ) {
		return false;
	}

	// see what directions are available
	// returns array of ints/directions
	dir = PA.getDirAvailable(p);

	// are there any directions available?
	if ( dir.length > 0 ) {
		// overwrite 'dir' with an int 0-7 (direction)
		// randomely choose one of the available directions
		dir = dir[parseInt(Math.random() * dir.length, 10)];
	} else {
		// no available direction so we're exiting
		return false;
	}

	// draw the first part of the line
	line1_points = PA.getLine( p, dir, true );

	// draw the second part of the line in the opposite direction
	line2_points = PA.getLine( p, ( dir + 4 ) % 8, false );

	// merge both lines together
	biline_points = PA.merge_lines( line1_points, line2_points );

	PA.drawLine( biline_points );
};

PA.merge_lines = function( l1, l2 ) {
	var p, pnext, i, l3, l2len;
	
	// if line2 is empty/false, return line1
	if ( l2 === false ) {
		return l1;
	}

	// reverse l2, but remove (shift off) first element which is a duplicate
	l2.shift();
	l2len = l2.length;
	l3 = l2.reverse();
	l3 = l3.concat( l1 );

	// only go through indices, objects of line2
	for ( i = l2len; i > 0; i = i - 1 ) {
		// p is the point, i index
		p = l3[i];
		pnext = l3[i - 1];

		if ( pnext.e ) {
			// transfer copy
			p.e = true;
			p.go_out = {x: pnext.go_in.x, y: pnext.go_in.y};
			p.go_in = {x: pnext.go_out.x, y: pnext.go_out.y};

			// delete from next
			delete pnext.e;
			delete pnext.go_out;
			delete pnext.go_in;
		}
	}

	return l3;

};

PA.drawLine = function( path_points ) {
	var i, p, path, cell_size;

	if ( path_points === false ) {
		return;
	}

	cell_size = PA.parameters.cell_size;

	// transform points to paths and draw the line
	path = 'M';
	for ( i in path_points ) {

		// convert index to object
		p = path_points[i];

		// check if the line went out of bounds
		if ( p.e ) {

			// add the mirrored section that goes out of bounds to the path
			path += ((p.go_out.x + 1.5) * cell_size) + ',' + ((p.go_out.y + 1.5 ) * cell_size);

			// do the actual drawing of the part in bounds
			d3.select('svg').append('path')
				.attr('d', path)
				.attr('stroke-linejoin','round').attr('stroke-linecap','round').attr('stroke', PA.parameters.line_colour).attr('stroke-width', PA.parameters.line_width).attr('fill', 'none');
			// add the line to the export object
			PA.export += "<path d='" + path + "' stroke-linejoin='round' stroke-linecap='round' stroke='blue' stroke-width='3' fill='none'/>\n";

			// reset the line path
			path= 'M';
			// add the mirrored section that comes from out of bounds
			path += ((p.go_in.x + 1.5) * cell_size) + ',' + ((p.go_in.y + 1.5 ) * cell_size) + ' ';
		}

		// build the line path incrementally
		path += ((p.x + 1.5) * cell_size) + ',' + ((p.y + 1.5) * cell_size) + ' ';
	}
	// draw the remaining line segments
	d3.select('svg').append('path')
		.attr('d', path)
		.attr('stroke-linejoin','round').attr('stroke-linecap','round').attr('stroke', PA.parameters.line_colour).attr('stroke-width', PA.parameters.line_width).attr('fill', 'none');
	
	// add the line to the export object
	PA.export += "<path d='" + path + "' stroke-linejoin='round' stroke-linecap='round' stroke='blue' stroke-width='3' fill='none' />\n";
};

PA.getLine = function( p, dir, locked) {
	var np, p_dir, path_array = [];

	// path_array holds the coordinates
	path_array.push( p );
	PA.addPoint( p );

	// go forever until we hit a 'wall'
	while (true) {
		// based on location and direction determine next point
		p_dir = PA.getDirection( p, dir, locked );

		// unlock after one call
		if ( locked ) {
			locked = false;
		}

		// if PA.getDirection cannot find a suitable point it returns false
		if ( p_dir === false ) {
			break;
		}

		// get ready for next pass inside loop
		p = p_dir.p;
		dir = p_dir.dir;

		// log the new point
		path_array.push( p );
		PA.addPoint( p );
	}

	// if there is only one point, do not draw, so return false
	if ( path_array.length === 1 ) {
		return false;
	}

	return path_array;
};

// checks which directions are possible to head
PA.getDirAvailable = function( p ) {
	var dirs = [], dir;

	// check all 8 directions
	for ( dir = 0; dir < 8; dir += 1 ) {
		// if the cell in this direction is available, save it
		if ( PA.isOriginToDestinationAvailable(p, PA.determinePoint(p, dir), dir) ) {
			dirs.push(dir);
		}
	}

	//array of available directions
	return dirs;
}

//determines next cell based on direction
PA.determinePoint = function( p, d ) {
	//javascript passes by reference! We need to create a copy because we may not accept the changes.
	var size = PA.grid.size,
		np = {x: p.x, y: p.y};
	
	//determine new coordinates
	switch (d) { 
		case 0:
			np.y -= 1;
			break;
		case 1:
			np.y -= 1;
			np.x += 1;
			break;
		case 2:
			np.x += 1;
			break;
		case 3:
			np.y += 1;
			np.x += 1;
			break;
		case 4:
			np.y += 1;
			break;
		case 5:
			np.y += 1;
			np.x -= 1;
			break;
		case 6:
			np.x -= 1;
			break;
		case 7:
			np.y -= 1;
			np.x -= 1;
			break;
	}
	
	//see if new points are outside grid in which case we need to wrap
	if ( np.x < 0 || np.x === size.w || np.y < 0 || np.y === size.h ) {
		// keep track of location going out of bounds
		np.go_out = {x: np.x, y:np.y};

		// determine location coming in from out of bounds
		// a little more involved to mirror out of good zone
		np.go_in = {x: p.x, y: p.y};
		// mirror x
		// if we are in the left column and the line is going leftwards
		if ( p.x == 0 && d > 4 ) {
			np.go_in.x = size.w;
		} 
		// if we are in the right column and the line is going rightwards
		if ( p.x == (size.w - 1) && ( d > 0 && d < 4 ) ) {
			np.go_in.x = -1;
		}

		// mirror y
		// if we are at the top row and the line is going upwards
		if ( p.y == 0 && ( d == 7 || d < 2 ) ) {
			np.go_in.y = size.h;
		}
		// if we are at the bottom row and the line is going downwards
		if ( p.y == (size.h - 1)  && ( d < 6 && d > 2 ) ) {
			np.go_in.y = -1;
		}

		// reset point
		np.x = (np.x + size.w) % size.w;
		np.y = (np.y + size.h) % size.h;
		
		// note that we have jumped
		np.e = true;
	}
	
	//return new coordinate object
	return np;
}

// determine if two 'adjacent' (diagonal included) points can be joined
PA.isOriginToDestinationAvailable = function( p, np, dir ) {
    var a, b;

    //check if new cell (np) is free
    if ( !PA.pointIsAvailable( np ) ) {
		// point is occupied
        return false;
    }
    
    //check if we criss cross a previous path
    if ( dir % 2 === 1 ) {
		// note that these coordinates are perpindicular relative to those which
		// our points are trying to establish - we are checking for a X-ing 
        a = p.x + '_' + np.y;
        b = np.x + '_' +  p.y;

        if ( PA.grid.crisx.indexOf(a + 'x' + b) >= 0 || PA.grid.crisx.indexOf(b + 'x' + a) >= 0) {
            return false;
        }
    }

	return true;
}

// check if a point is free
PA.pointIsAvailable = function( p ) {
    //check if new cell (np) is already occupied
    if ( PA.grid.data[p.x] && PA.grid.data[p.x][p.y] ) {
        return false;
    }

	return true;
}

//adds a point to the path and data objects
PA.addPoint = function( p ) {
	//check if this row/x object exists. If not create it.
	if (!PA.grid.data[p.x]) {
		PA.grid.data[p.x] = {};
	}
    
	//set the cell state as occupied/true
	PA.grid.data[p.x][p.y] = true;
}

//returns a random direction of an available cell constrained by it's current direction
PA.getDirection = function( p, current_direction, locked ) {
	var i, switch_select, dir, np;
	
	//current_direction is supplied, there are only three choices, continue, left, right

	//randomely choose one/three directions
	switch_select = Math.floor(Math.random() * 3);
	
	for ( i = 0; i < 3; i += 1 ) {
		   
		// increment and mod, this way we try each of the three directions
		switch_select = (switch_select + 1) % 3;

		// if locked we will try the current_direction first 
		if (locked) {
			switch_select = 0;
			locked = false;
		}

		//handle direction
		switch (switch_select) {
			case 0:
				//continue going in same direction
				dir = current_direction;
				break;
			case 1:
				//go left (-1)
				if (current_direction === 0) {
					dir = 7;
				} else {
					dir = current_direction - 1;
				}
				break;
			case 2:
				//go right (+1)
				if (current_direction === 7) {
					dir = 0;
				} else {
					dir = current_direction + 1;
				}
				break;
		}

		//check if using this direction there is a valid point
		np = PA.determinePoint( p, dir );
		if ( PA.isOriginToDestinationAvailable( p, np, dir ) ) {
			// ok so no diagonal lines are in our way
			// need to check if this line is diagonal and if so keep track of it
			if ( dir % 2  === 1 ) {                                                                                                                                    
				PA.grid.crisx.push( p.x + '_' + p.y + 'x' + np.x + '_' + np.y );
			}

			// return our new point coordinate and direction
            return { 'p': np, 'dir': dir };
        }
    }
    //could not go in any three of the directions, quit line
    return false;
}

// reads settings then draws
PA.prep = function() {
	var lines, x, y, size, w, h;

	// clean up
	// remove svg canvas
	d3.select('svg').remove();

	// get default values
	size = PA.parameters.cell_size
	w = PA.parameters.dimension.w / size;
	h = PA.parameters.dimension.h / size;
	
	// set the export string
	PA.export = '<?xml version="1.0" encoding="utf-8" standalone="yes"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="' + PA.parameters.dimension.w + '" height="' + PA.parameters.dimension.h + '" viewBox="' + size + ' ' + size + ' ' + PA.parameters.dimension.w + ' ' + PA.parameters.dimension.h + '">\n';
	
	// create data object
	grid = {
		size: {
			'w': w,
			'h': h},
		data: {}, // holds coordinate pair points {origin point, destination point}
        crisx: []
		};
	
	// ------------ Make SVG -------------- //

	// create SVG 
	d3.select('#svgcanvas').append('svg')
		.attr('width', PA.parameters.dimension.w).attr('height', PA.parameters.dimension.h)
		.attr('viewBox', size + ' ' + size + ' ' + PA.parameters.dimension.w + ' ' + PA.parameters.dimension.h);

	// the cells x,y are in ([1-w],[1-h])
	// but we display wrapping
	// Do not draw grid
	if ( false ) {
		for( x = -1; x < w + 1; x = x + 1) {
			for( y = -1; y < h + 1; y = y + 1) {
				if (x === -1 || y === -1 || x === w || y === h) {
					// draw outside edge cells - type 3 don't really exist
					d3.select('svg').append('rect')
						.attr('id', x + '_' + y)
						.attr('stroke', 'white').attr('fill', '#ddaaaa').attr('stroke-width',2)
						.attr('x', ( x + 1 ) * size).attr('y', ( y + 1) * size).attr('width', size).attr('height', size);
					grid.data[x + '_' + y] = {type: 3, mirror: {x: (x + w)%w, y: (y + h)%h}}
				} else if (x === 0 || y === 0 || x === (w - 1) || y === (h - 1) ) {
					// draw inner edge cells - type 2
					d3.select('svg').append('rect')
						.attr('id', x + '_' + y)
						.attr('stroke', 'white').attr('fill', '#aaaadd').attr('stroke-width',2)
						.attr('x', ( x + 1 ) * size).attr('y', ( y + 1) * size).attr('width', size).attr('height', size);
					grid.data[x + '_' + y] = {type: 2}
				} else {
					// draw main area cells - type 1
					d3.select('svg').append('rect')
						.attr('id', x + '_' + y)
						.attr('stroke', 'white').attr('fill', '#aaaadd').attr('stroke-width',2)
						.attr('x', ( x + 1 ) * size).attr('y', ( y + 1) * size).attr('width', size).attr('height', size);

					// create/initialize data objects
					grid.data[x + '_' + y] = {type: 1}
				}
			}
		}
	}// do not draw grid

	// draw clip line for tilling
	d3.select('svg').append('rect')
		.attr('id', 'clip_line')
		.attr('stroke', 'black').attr('fill','none').attr('stroke-width', 2)
		.attr('x', size).attr('y', size).attr('width', size * w).attr('height', size * h);
	
	// export clip rect
	PA.export += "<rect x='" + size + "' y='" + size + "' width='" + size * w + "' height='" + size * h + "' fill='none' stroke='black' stroke-width='2'/>\n";

	PA.grid = grid;

	// ------------- Start drawing the paths ------------ //
	// randomley seed
	for ( lines = PA.grid.size.w + PA.grid.size.h; lines > 0; lines = lines - 1 ) {
		// Random
		PA.drawBiline(parseInt(Math.random() * PA.grid.size.w, 10), parseInt(Math.random() * PA.grid.size.h, 10));
	}

	//then meticulously go over space                                                                                                                                                        
	for ( i = 0; i < PA.grid.size.w; i += 1 ) {
		for ( j = 0; j < PA.grid.size.h; j += 1 ) {
			PA.drawBiline(i, j);
		}
	}

	// Centred
	//PA.drawBiline(PA.grid.size.w/2, PA.grid.size.h/2);
	
	// Finish the export string
	PA.export += '</svg>';

	//add value string to export form
	document.getElementById('svgexport').setAttribute('value', PA.export)
}

// called on load
PA.init = function() {
	// onload stuff
	//PA.prep();
}

window.onload = PA.init;
