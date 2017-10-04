"use strict";
(function(){

  let clock = new THREE.Clock(),
    camera, controls, scene, renderer, mixer, bones=[], skeletonHelper;

  let t=0.99, controlIndex=0, tPositon=0, positionIndex=0;
  let p = new THREE.Vector3();

  function setupSkeleton(result) {

  	console.log(result)
 
   	mixer = result;

   	_.forEach(result.clip.tracks, function(d,i) {
   		if(d.times.length==2)
   		{
   		 if(d.values.length==8) {
   				_.forEach(result.skeleton.bones, function(bone,i){
	   				if(bone.name == d.name.match(/\[(.*?)\]/)[1])
	   					bone.quaternion.set(d.values[0],d.values[1],d.values[2],d.values[3]);
	   				
	   			});
   			}
   		}
   	});

   	_.forEach(result.skeleton.bones, function(d,i){
   		if(d.name!="ENDSITE")
   			bones.push(d);
   	});

	    skeletonHelper = new THREE.SkeletonHelper( result.skeleton.bones[ 0 ] );
      skeletonHelper.skeleton = result.skeleton; // allow animation mixer to bind to SkeletonHelper directly

      let boneContainer = new THREE.Group();
      boneContainer.add( result.skeleton.bones[ 0 ] );

      scene.add( skeletonHelper );
      scene.add( boneContainer );
  }


  function loadBVH(model) {
    return new Promise(function(resolve, reject) {
      let loader = new THREE.BVHLoader();
      loader.load( model, function(result){
        resolve(result);
      });
    });
  }


  function init() {

    /* Load the BVH models*/
    loadBVH("models/bvh/Male1_Run.bvh").then(function(result){
      /* Setup the model once the async data fetch resolves  */
      setupSkeleton(result);
    });

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.set( 0, 0 , 600 );

    // controls = new THREE.OrbitControls( camera );
    // controls.minDistance = 300;
    // controls.maxDistance = 700;

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xeeeeee );

    scene.add( new THREE.GridHelper( 400, 10 ) );

    // renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    document.body.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize, false );

    /* animate the scene */

    animate();
  }

  function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

  }

  function deCasteljau(p0, p1, p2, p3, bone) {
	  let q0 = new THREE.Quaternion();
    let q1 = new THREE.Quaternion();
    let q2 = new THREE.Quaternion();
    let r0 = new THREE.Quaternion();
    let r1 = new THREE.Quaternion();
    t = t + 0.005; 

  	q0 = p0.slerp(p1,t);
  	q1 = p1.slerp(p2,t);
  	q2 = p2.slerp(p3,t);
  	r0 = q0.slerp(q1,t);
  	r1 = q1.slerp(q2,t);

   	THREE.Quaternion.slerp(r0, r1, bone.quaternion, t );

  }

  function rotationManager(bone, component, index) {
  	
    let p0 = new THREE.Quaternion();
    let p1 = new THREE.Quaternion();
    let p2 = new THREE.Quaternion();
    let p3 = new THREE.Quaternion();

    p0.set(component[controlIndex], component[(controlIndex+1)], component[(controlIndex+2)], component[(controlIndex+3)]);
    p1.set(component[(controlIndex+4)], component[(controlIndex+5)], component[(controlIndex+6)], component[(controlIndex+7)]);
    p2.set(component[(controlIndex+8)], component[(controlIndex+9)], component[(controlIndex+10)], component[(controlIndex+11)]);
    p3.set(component[(controlIndex+12)], component[(controlIndex+13)], component[(controlIndex+14)], component[(controlIndex+15)]);
	
    deCasteljau(p0, p1, p2, p3, bone);
  }

  function positionManager(bone, component, index) {
  	let p0 = new THREE.Vector3();
  	let p1 = new THREE.Vector3();


  	p0.x = component[positionIndex];
  	p0.y = component[positionIndex+1];
  	p0.z = component[positionIndex+2];


    p1.x = component[component.length-3];
  	p1.y = component[component.length-2];
  	p1.z = component[component.length-1];

  	tPositon = tPositon + 0.005; 
   
  	p.addVectors(p0.multiplyScalar(1-tPositon), p1.multiplyScalar(tPositon));

  	bone.position.x = p.x;
  	bone.position.y = p.y;
  	bone.position.z = p.z;

    camera.position.set( p.x, p.y ,p.z + 400);
  }

  function animate() {

    requestAnimationFrame( animate );

    if ( mixer ) {
    	if(t>=1)
    	{
    		t=0;
			  controlIndex= (controlIndex + 12)%180;
    	}

    	_.forEach(mixer.clip.tracks, function(d,i) {
    		if(d.times.length==46)
   			{
   				if(d.values.length==184) {
   					_.forEach(mixer.skeleton.bones, function(bone,i){
	   					if(bone.name == d.name.match(/\[(.*?)\]/)[1])
	   					{
    						rotationManager(bone, d.values, i)
    					}
    				});
    			}
    			else if(d.values.length==138) {
    				_.forEach(mixer.skeleton.bones, function(bone,i){
	   					if(bone.name == d.name.match(/\[(.*?)\]/)[1])
	   					{
							positionManager(bone, d.values, i)
						}
					});
    			}
    		}
    	});
    }

    renderer.render( scene, camera );

  }

  /* start the application once the DOM is ready */
  document.addEventListener('DOMContentLoaded', init);

})();