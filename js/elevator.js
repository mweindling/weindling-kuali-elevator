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
    // TODO: Need a real algorithm here
    let e = this.availableElevators()[0];

    // dispatch to elevator
    e.requestCall(floorNum, direction);
  }

  /**
   * Find list of available elevators
   */
  availableElevators() {
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
    this.callRequests = [];  // TODO: I think we can remove this and just check the elevators for call requests?
    this.curFloor = 1;
    this.direction = null;
    this.selections = new Set();
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
    else if(!hasCallRequest(floorNum, direction)) {
      // add the request if we don't already have it
      this.callRequests[this.callRequests.length] = {floorNum, direction};
    }
  }

  /**
   * Remove call request
   * @param floorNum
   * @param direction
   */
  removeCallRequest(floorNum, direction) {
    // TODO: implement this
  }

  /**
   * Check if we have a matching call request
   */
  hasCallRequest(floorNum, direction) {
    for(let i=0; i<this.callRequests.length; i++) {
      if(this.callRequests[i].floorNum == floorNum && this.callRequests[i].direction == direction) {
        return true;
      }
    }
    return false;
  }

  /**
   * Move the elevator up a floor (if we can)
   */
  moveUp() {
    if(this.curFloor >= this.controller.numFloors) {
      // can't go up
      this.direction = 'down';
    } else {
      this.curFloor++;
      this.direction = 'up';
    }
    this.processFloor();
  }

  /**
   * Move the elevator down a floor (if we can)
   */
  moveDown() {
    if(this.curFloor == 1) {
      // can't go down
      this.direction = 'up';
    } else {
      this.curFloor--;
      this.direction = 'down';
    }
    this.processFloor();
  }

  /**
   * Add selected floor for this elevator
   * @param floorNum
   */
  addSelection(floorNum) {
    this.selections.add(floorNum);
  }

  removeSelection(floorNum) {
    this.selections.remove(floorNum);
  }

  /**
   * Handle actions on the floor we just reached (if any actions necessary)
   * Initiate move to next floor when done (if applicable)
   */
  processFloor() {
    let shouldOpen = false;
    if(this.hasCallRequest(this.curFloor, this.direction)) {
      shouldOpen = true;
      this.removeCallRequest(this.curFloor, this.direction);
    }
    if(this.hasSelection(this.curFloor)) {
      shouldOpen = true;
      this.removeSelection(this.curFloor);
    }
  }



}

