const NEW_ACTION_PROP   = Symbol( 'newAction' );
const ITEMS_LIST_PROP   = Symbol( 'itemsList' );
const FINAL_ITEM        = Symbol( 'finalItem' );

let isRunning = false;

var proxyHandler = {
  set: function( target, property, value, receiver ) {
    if ( property === NEW_ACTION_PROP ) {
      target[ ITEMS_LIST_PROP ].push( value );
    } else {
      target[ property ] = value;
    }

    return true;
  }
};

var instance = null;

const run = () => {
  isRunning = true;
  doNext();
};

const doNext = () => {
  const queue = TheQueue.getInstance();
  const action = queue.proxiedObject[ ITEMS_LIST_PROP ].shift();

  if ( action ) {
    return action()
      .then( () => {
        if ( !queue.proxiedObject[ ITEMS_LIST_PROP ].length ) {
          return stop();
        } else {
          return doNext();
        }
      } );
  }
};

const stop = () => {
  const queue = TheQueue.getInstance();
  const finalAction = queue.proxiedObject[ FINAL_ITEM ];

  if ( finalAction ) {
    return finalAction().then( () => {
      isRunning = false;
    } );
  }
};

class TheQueue {

  constructor() {
    var originalObject = { [ ITEMS_LIST_PROP ] : [] };
    this.proxiedObject = new Proxy( originalObject, proxyHandler );
  }

  static getInstance() {
    instance = instance || new TheQueue();

    return instance;
  }

  addAction( action ) {
    this.proxiedObject[ NEW_ACTION_PROP ] = action;

    if ( !isRunning && this.proxiedObject[ ITEMS_LIST_PROP ].length === 1 ) {
      run();
    }
  }

  afterAll( action ) {
    this.proxiedObject[ FINAL_ITEM ] = action;
  }
}

export default TheQueue.getInstance()
