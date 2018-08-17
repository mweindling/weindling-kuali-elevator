const MAINTENANCE_LIMIT = 100;

/**
 * Time in ms that a move from one floor to the next takes
 * @type {number}
 */
const MOVEMENT_SIMULATION_MS = 2000;

/**
 * Amount of time the door stays open in ms
 * @type {number}
 */
const DOOR_OPEN_TIME_MS = 2000;

/**
 * The controller stores some centralized info regarding the system and coordinates certain
 * activities amongst the elevators.  The controller is aware of each of the elevators in its
 * system.
 */
class ElevatorController {

  constructor(numElevators, numFloors) {

    this.numFloors = numFloors;

    // initialize elevators
    this.elevators = [];
    for (let n = 1; n <= numElevators; n++) {
      let id = 'elevator-' + n;
      this.elevators[this.elevators.length] = new Elevator(this, id);
    }
  }

  /**
   * Initiate a request and dispatch to an elevator
   * @param floorNum int floor number
   * @param direction string direction ('up' | 'down')
   */
  makeRequest(floorNum, direction) {
    let availableElevators = this.findAvailableElevators();
    if(availableElevators.length == 0) {
      console.log('No available elevators...');
      return;
    }

    // find closes  unoccupied elevator
    let unoccupied = this.findUnoccupiedElevators(availableElevators);
    let elevator =  this.findClosestElevator(unoccupied, floorNum, direction);

    // if not found, find closest of any available elevators
    if(!elevator) {
      elevator = this.findClosestElevator(availableElevators, floorNum, direction);
    }

    // dispatch to elevator
    elevator.requestCall(floorNum, direction);
  }

  /**
   * Find the closest elevator to the given floor (considers direction as well, since elevators
   * moving in the opposite direction need to service their requests then turn around).
   * @param availableElevators
   * @param floorNum
   * @param direction
   * @returns Elevator
   */
  findClosestElevator(availableElevators, floorNum, direction) {
    let closest = null;
    let minDistance = null;

    availableElevators.forEach(e=>{
      let distance;

      if(e.direction == null || e.direction == direction) {
        // if elevator is not moving, or moving in the same direction, then just find the delta
        distance = Math.abs(e.floorNum - floorNum);
      }
      else {
        // if elevator is moving in opposite direction, then the total is the number of floors
        // remaining on the current trip + num floors to respond to call (from end of trip)
        if(e.direction == 'up') {
          let maxSelection = e.findHighestSelection();
          let maxCall = e.findHighestCallRequest();
          let highest = maxSelection === null ? maxCall : maxCall === null ? maxSelection : Math.max(maxSelection, maxCall);
          distance = (highest - e.floorNum) + (highest - floorNum);
        } else {
          let minSelection = e.findLowestSelection();
          let minCall = e.findLowestCallRequest();
          let lowest = minSelection === null ? minCall : minCall === null ? minSelection : Math.min(minSelection, minCall);
          distance = (e.floorNum - lowest) + (floorNum - lowest);
        }
      }

      // Distance is calculated, is it the closest?
      if(minDistance == null || distance < minDistance) {
        minDistance = distance;
        closest = e;
      }
    });
    return closest;
  }


  /**
   * Find list of available elevators
   */
  findAvailableElevators() {
    return this.elevators.filter(e => e.isInService());
  }

  findUnoccupiedElevators(arr) {
    return arr.filter(e => !e.isOccupied());
  }

  /**
   * Check if there are pending call requests to the floor that the elevator is on.
   * If there are, then we will move the call request to the elevator that initiated this
   * callback (because this means its about to arrive at the floor)
   * Since this happens before the floor is processed, the elevator should stop and open,
   * thus satisfying the call request.
   */
  beforeProcessFloor(elevator) {
    // check other elevators for calls that match this elevators floor / direction
    // if found, remove the request from the other elevator
    let foundCall = false;
    this.findAvailableElevators().forEach(otherElevator => {
      if(otherElevator != elevator && otherElevator.hasCallRequest(elevator.curFloor, elevator.direction)) {
        otherElevator.removeCallRequest(elevator.curFloor, elevator.direction);
      }
    });

    // if found at least one request then add it to the current elevator so that it can complete the request
    if(foundCall) {
      elevator.makeRequest(elevator.floorNum, elevator.direction);
    }
  }
}



/**
 * Represents an elevator in the system.
 */
class Elevator {

  constructor(controller, id) {
    this.id = id;
    this.controller = controller;
    this.inService = true;
    this.curFloor = 1;
    this.movementCount = 0;
    this.tripCount = 0;
    this.doorOpen = false;

    // current direction -- will continue in this direction until there are no more
    // selections / requests in this direction.
    this.direction = null;

    // call requests that this elevator is responding to
    this.callRequests = [];

    // selections made inside the elevator
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
    if(this.curFloor == floorNum && (this.direction == null || this.direction == direction)) {
      this.open();
    }
    else if(!this.hasCallRequest(floorNum, direction)) {
      // add the request if we don't already have it
      this.callRequests[this.callRequests.length] = {floorNum, direction};

      // initiate movement if needed (if direction is not null then we are presumably already moving)
      if(this.direction == null) {
        this.move(floorNum > this.curFloor ? 'up' : 'down');
      }
    }
  }

  /**
   * Remove call request
   * @param floorNum
   * @param direction
   */
  removeCallRequest(floorNum, direction) {
    // iterate backwards so splicing doesnt alter the remaining indexes
    for(let i=this.callRequests.length-1; i >= 0; i--) {
      let req = this.callRequests[i];
      if (req.floorNum == floorNum && req.direction == direction) {
        this.callRequests.splice(i,1);
      }
    }
  }

  /**
   * Check if we have a matching call request
   */
  hasCallRequest(floorNum, direction) {
    return this.callRequests.some(req => req.floorNum == floorNum && req.direction == direction);
  }

  /**
   * Move in the given direction
   */
  move(dir) {
    let nextFloor = this.curFloor;

    if(!dir || (dir == 'up' && this.curFloor >= this.controller.numFloors)
        || (dir == 'down' &&  this.curFloor <= 1) ) {
      // upper and lower bounds, just stay on and process current floor
      // TODO: handle some sort of error?
    }
    else {
      this.direction = dir;
      nextFloor = dir == 'up' ? (this.curFloor+1) : (this.curFloor-1);
    }

    // actually simulate the move (move for X ms, then stop, tick floor, process
    setTimeout(()=>{
      this.movementCount += Math.abs(this.curFloor - nextFloor); // (just in case no mvmt)
      this.curFloor = nextFloor;
      console.log(this.id + ' moved to floor: ' + this.curFloor);
      this.processFloor();
    }, MOVEMENT_SIMULATION_MS);
  }

  tickTripCount() {
    this.tripCount++;
    if(this.tripCount >= MAINTENANCE_LIMIT) {
      this.inService = false;
      // TODO: Should we do anything else?  This should at least stop new requests / selections
    }
  }

  /**
   * Add selected floor for this elevator
   * @param floorNum
   */
  makeSelection(floorNum) {
    // only allow new selections if in service
    if(this.isInService()) {
      this.selections.add(floorNum);
    }

    // initiate movement if needed
    if(this.direction == null) {
      this.move(floorNum > this.curFloor ? 'up' : 'down');
    }
  }

  /**
   * remove floor selection
   * @param floorNum
   */
  removeSelection(floorNum) {
    let removed = this.selections.delete(floorNum);

    // if something was removed and there are no selections / calls remaining, then complete trip
    if(removed && this.selections.size == 0 && this.callRequests.length == 0) {
      this.tickTripCount();
    }
  }

  hasSelection(floorNum) {
    return this.selections.has(floorNum);
  }

  /**
   * Handle actions on the floor we just reached (if any actions necessary)
   * Initiate move to next floor when done (if applicable)
   */
  processFloor() {

    // give the controller a chance to push a request to it
    this.controller.beforeProcessFloor(this);

    if(this.hasCallRequest(this.curFloor, this.direction) || this.hasSelection(this.curFloor)) {
      // (open will handle next action after some amount of time, by re-calling this method)
      this.open();
      return;
    }

    // do we have any calls / selections left?
    if(this.callRequests.length == 0 && this.selections.size == 0) {
      this.processIdle();
    }

    // do we have any more calls / selections in the current direction
    else if(this.shouldContinueInDirection(this.direction)) {
      this.move(this.direction);
    }

    // still have more requests, but they are in the opposite direction
    // change direction, and re-process (will open if we are at a requested floor, or move if not)
    else {
      this.direction = this.direction == 'up' ? 'down' : 'up';
      this.processFloor();
    }

  }

  /**
   * Tells us if there are any selections in the given direction (relative to the current floor)
   * Or if the next call request is in the direction
   * @param direction
   * @returns {boolean}
   */
  shouldContinueInDirection(direction) {
    // if we have a selection in the requested direction, continue
    if(Array.from(this.selections).some((f)=>
        (direction=='up' && this.curFloor < f) || (direction=='down' && this.curFloor > f))) {
      return true;
    }

    // if the NEXT call request is in the requested direction, continue
    if(this.callRequests.length > 0 &&
      ((direction=='up' && this.curFloor < this.callRequests[0].floorNum) ||
      (direction=='down' && this.curFloor > this.callRequests[0].floorNum))) {
      return true;
    }

    return false;

  }

  /**
   * Find floor of the lowest remaining selection (or null if none)
   * @returns {*}
   */
  findLowestSelection() {
    let min = null;
    this.callRequests.forEach(n => {
      min = min == null ? n : Math.min(min, n);
    });
    return min;
  }

  /**
   * Find floorNumber of highest remaining selection (or null if none)
   * @returns {*}
   */
  findHighestSelection() {
    let max = null;
    this.callRequests.forEach(n => {
      max = max == null ? n : Math.max(max, n);
    });
    return max;
  }

  /**
   * Find floorNumber of the lowest remaining call request (or null if none)
   * @returns {*}
   */
  findLowestCallRequest() {
    if(this.callRequests.length == 0) {
      return null;
    }
    let min = null;
    this.callRequests.forEach(req => {
      min = min == null? req.floorNum : Math.min(min, req.floorNum);
    });
    return min;
  }

  /**
   * Find floorNumber of the highest remaining call request (or null if none)
   * @returns {*}
   */
  findHighestCallRequest() {
    if(this.callRequests.length == 0) {
      return null;
    }
    let max = null;
    this.callRequests.forEach(req => {
      max = max == null? req.floorNum : Math.max(max, req.floorNum);
    });
    return max;
  }

  /**
   * Simulate opening the door (and clear requests / selections for this floor)
   */
  open() {
    if(!this.doorOpen) {
      console.log('Opening door to elevator: ' + this.id);
    }

    // reset selections
    this.removeCallRequest(this.curFloor, this.direction);
    this.removeSelection(this.curFloor);

    // wait for some amount of time and then close (and re-process to initiate next move)
    // we do this even if the door is already open (extends the open time)
    this.doorOpen = true;
    setTimeout(
      ()=>{
        this.close();
        this.processFloor();
      },
      DOOR_OPEN_TIME_MS);
  }

  /**
   * Close the door
   */
  close() {
    // check if already closed
    if(!this.doorOpen) {
      return;
    }

    console.log('Closing door to elevator: ' + this.id);
    this.doorOpen = false;
  }

  isOccupied() {
    return this.doorOpen || this.selections.size > 0 || this.callRequests.length > 0;
  }

  /**
   * Handle action when enter idle state (no requests, no selections)
   */
  processIdle() {
    console.log('Idling elevator ' + this.id);
    // TODO: should we do something?  stay still for now.
    // Probably should tell the controller, so it could  check if there are pending call requests
    // for us to take.
    this.direction = null;
  }
}

