# Kuali Interview Assignment - Mark Weindling

see js/elevator.js:

This file contains 2 JS classes:
* ElevatorController class
* Elevator class

Note that I think I may have misinterpreted the requirement slightly and made this a little more complicated than it was supposed to be.  I am treating this as a normal elevator (e.g. SELECTION is made inside the elevator, and floor CALLS are made with a given direction).  After re-reading, I realize the instructions may be indicating that the floor selection is actually made at the floor, not inside the elevator.  I apologize if this was a bad interpretation on my part... I think the general idea of the design is similar, though.  The main difference is that my code is assuming two forms of request... a SELECTION inside the elevator, or a CALL made from a floor (with a direction).

I did not complete all of the coding... there are some functions that are missing / marked with TODOs.

The general idea was that there would be a controller with the common "elevator system" information that knows about the collection of elevators and the number of floors.  It issues the call requests according to the algorithm (closest elevator gets the request).

Each elevator instance is responsible for managing its movements, and its own selections (inside the elevator).  It also knows about the call requests that it has been assigned.  Before each floor is passed, the elevator makes a callback to the controller to give it a chance to re-assign its call request.  This callback is in place to handle the requirement that occupied elevators passing a call request should stop at that request.


