import { useEffect, useRef, useState } from "react";

export function useDebounceCallback(callback: CallableFunction, ms: number, ...dependencies: unknown[]) {
    const timeoutRef = useRef<number | undefined>(undefined)
    
    useEffect(() => {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(callback, ms)
    }, dependencies)
}

export function useDebounce<T = unknown>(value: T, ms: number) {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)
    const timeoutRef = useRef<number | undefined>(undefined)
    
    useEffect(() => {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
            setDebouncedValue(value)
        }, ms)
    }, [value])
    return debouncedValue
}