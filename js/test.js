/*
 * A few test cases to run manually
 * Can watch in browser console
 */


// a few elevators servicing requests
/*
let controller = new ElevatorController(2, 30);
controller.makeRequest(3, 'down');
controller.makeRequest(6, 'up');
*/

// a few elevators with selections
/*
let controller = new ElevatorController(2, 30);
controller.elevators[0].makeSelection(3);
controller.elevators[1].makeSelection(5);
*/

// combination of selections and calls
let controller = new ElevatorController(2, 30);
controller.elevators[0].makeSelection(10);
controller.elevators[1].makeSelection(2);
controller.elevators[1].makeSelection(3);
controller.makeRequest(4,'up');
controller.makeRequest(7,'down');
