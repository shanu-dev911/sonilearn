
'use client';

import * as THREE from 'three';
import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float } from '@react-three/drei';

const StudyObject = ({ geometry, material, position, rotationSpeed, floatSpeed, rotationIntensity, floatIntensity, scale }: any) => {
    const ref = useRef<THREE.Mesh>(null!);
    
    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (ref.current) {
            ref.current.rotation.y += rotationSpeed * 0.01;
            ref.current.rotation.x += rotationSpeed * 0.005;
        }
    });

    return (
        <Float speed={floatSpeed} rotationIntensity={rotationIntensity} floatIntensity={floatIntensity}>
            <mesh
                ref={ref}
                geometry={geometry}
                material={material}
                position={position}
                scale={scale}
            />
        </Float>
    );
};

const OrbitingObjects = () => {
    const groupRef = useRef<THREE.Group>(null!);

    useFrame((state) => {
        if(groupRef.current){
            groupRef.current.rotation.y += 0.0005;
        }
    });

    const glassMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
        transmission: 1.0,
        roughness: 0.05,
        thickness: 1.5,
        ior: 1.3,
        envMapIntensity: 0.4,
        color: "#e0f2fe",
    }), []);
    
    const geometries = useMemo(() => ({
        book: new THREE.BoxGeometry(1.5, 2, 0.3),
        capBody: new THREE.CylinderGeometry(0.6, 0.5, 0.4, 32),
        capTop: new THREE.BoxGeometry(1.4, 0.1, 1.4),
        crystal: new THREE.IcosahedronGeometry(0.8, 0),
        pen: new THREE.CylinderGeometry(0.05, 0.05, 1.5, 16),
    }), []);

    return (
        <group ref={groupRef} dispose={null}>
             {/* Main Book */}
            <StudyObject 
                geometry={geometries.book} 
                material={glassMaterial} 
                position={[3, 0, 0]} 
                rotationSpeed={0.3} 
                floatSpeed={1} 
                rotationIntensity={0.2}
                floatIntensity={0.3}
                scale={1}
            />
            {/* Graduation Cap */}
            <group position={[-2, 1, 2]}>
                 <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.4}>
                    <mesh geometry={geometries.capBody} material={glassMaterial} position={[0, -0.2, 0]} />
                    <mesh geometry={geometries.capTop} material={glassMaterial} position={[0, 0.1, 0]} />
                 </Float>
            </group>
            {/* Crystal */}
            <StudyObject 
                geometry={geometries.crystal} 
                material={glassMaterial} 
                position={[-1.5, -1, -2.5]} 
                rotationSpeed={0.5} 
                floatSpeed={1.5} 
                rotationIntensity={0.5}
                floatIntensity={0.5}
                scale={1}
            />
             {/* Pen */}
            <StudyObject 
                geometry={geometries.pen} 
                material={glassMaterial} 
                position={[1, 1.5, -3]} 
                rotationSpeed={0.2} 
                floatSpeed={0.8} 
                rotationIntensity={0.1}
                floatIntensity={0.2}
                scale={1}
            />
        </group>
    )
}


const SceneContent = () => {
    const { viewport, mouse } = useThree();
    const groupRef = useRef<THREE.Group>(null!);

    useFrame(() => {
        if (groupRef.current) {
            const x = (mouse.x * viewport.width) / 100;
            const y = (mouse.y * viewport.height) / 100;
            groupRef.current.rotation.y += (x - groupRef.current.rotation.y) * 0.02;
            groupRef.current.rotation.x += (y - groupRef.current.rotation.x) * 0.02;
        }
    });

    return (
        <>
            <ambientLight intensity={1.5} />
            <directionalLight position={[0, 5, 5]} intensity={2} color="white" />
            <hemisphereLight intensity={1} groundColor="blue" />

            <group ref={groupRef}>
                <OrbitingObjects />
            </group>
        </>
    );
};

const Scene = () => {
    return (
        <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
            <Suspense fallback={null}>
                <SceneContent />
            </Suspense>
        </Canvas>
    );
};

export default Scene;
