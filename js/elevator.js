/**
 * The controller stores some centralized info regarding the system and coordinates certain
 * activities amongst the elevators.  The controller is aware of each of the elevators in its
 * system.
 */
class ElevatorController {

  ElevatorController(numElevators, numFloors) {

    this.numFloors = numFloors;

    // initialize call requests (empty)
    // this is an array of objects in the form {floorIdx:int}, direction:'up|down'}
    // unclear if a call should indicate direction... assuming they do for now
    this.callRequests = [];

    // initialize elevators
    this.elevators = [];
    for(let n=1; n<=numElevators; n++) {
      this.elevators[this.elevators.length] = new Elevator(this);
    }
  }
}


/**
 * Represents an elevator in the system.
 */
class Elevator {

  Elevator(controller) {
    this.controller = controller;
  }

}
