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
    for (let n = 1; n <= numElevators; n++) {
      this.elevators[this.elevators.length] = new Elevator(this);
    }
  }

  /**
   * Initiate a request and dispatch to an elevator
   * @param floorNum int floor number
   * @param direction string direction ('up' | 'down')
   */
  makeRequest(floorNum, direction) {
    // find available elevator per instructions
    // dummy code will just pull the first elevator
    let e = this.availableElevators()[0];

    // dispatch to elevator
    e.requestCall(floorNum, direction);
  }

  /**
   * Find list of available elevators
   */
  availabileElevators() {
    return this.elevators.filter(e => e.isActive());
  }
}



/**
 * Represents an elevator in the system.
 */
class Elevator {

  Elevator(controller) {
    this.controller = controller;
    this.inService = true;
    this.callRequests = [];
    this.curFloor = null;
    this.direction = null;
  }

  /**
   * Determines if this is in service
   */
  isInService() {
    return this.inService;
  }

  /**
   * Processes a call request to this elevator
   * @param floorNum
   * @param direction
   */
  requestCall(floorNum, direction) {
    // just open if we are already on this floor (and direction matches, or no direction)
    if(curFloor == floorNum && (this.direction == null || this.direction == direction)) {
      open();
    }
    else if(!hasCallRequest()) {
      // add the request if we don't already have it
      this.callRequests[this.callRequests.length] = {floorNum, direction};
    }
  }

  /**
   * Check if we have a matching call request
   */
  hasCallRequest(floorNum, direction) {

  }

}

