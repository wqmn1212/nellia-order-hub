import { useCallback, useEffect, useRef, useState } from "react";

// 드래그앤드롭 + 클립보드 붙여넣기로 파일을 받는 공용 훅.
// onFiles(File[]) 콜백으로 받은 파일 배열을 전달한다.
// options.imagesOnly: true면 이미지 타입만 통과.
// options.pasteEnabled: true면 문서 전역 paste 이벤트를 구독 (한 화면에 하나만 켜는 것을 권장).
export function useDropPaste(onFiles, { imagesOnly = false, pasteEnabled = true } = {}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const onFilesRef = useRef(onFiles);
  onFilesRef.current = onFiles;

  const filterFiles = useCallback(
    (files) => {
      const arr = Array.from(files || []);
      return imagesOnly ? arr.filter((f) => f.type.startsWith("image/")) : arr;
    },
    [imagesOnly]
  );

  const onDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer?.items?.length) setIsDragging(true);
  }, []);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);
      const files = filterFiles(e.dataTransfer?.files);
      if (files.length) onFilesRef.current(files);
    },
    [filterFiles]
  );

  useEffect(() => {
    if (!pasteEnabled) return;
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files = [];
      for (const item of items) {
        if (item.kind === "file") {
          const f = item.getAsFile();
          if (f && (!imagesOnly || f.type.startsWith("image/"))) files.push(f);
        }
      }
      if (files.length) {
        e.preventDefault();
        onFilesRef.current(files);
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [pasteEnabled, imagesOnly]);

  return {
    isDragging,
    dropHandlers: { onDragEnter, onDragOver, onDragLeave, onDrop },
  };
}