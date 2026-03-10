
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, FileUp, Download, Play, AlertCircle, CheckCircle2, Loader2, X, ChevronUp, ChevronDown, ListFilter, Trash2, Lock, ShieldCheck, Code } from 'lucide-react';
import { ApiSettings, ProcessingRow, ColumnConfig } from './types';
import { DEFAULT_COLUMNS } from './constants';
import { getAddressInfo, getBuildingRegistry } from './services/apiService';
import { parseAddressesFromFile, downloadResults, downloadTemplate } from './utils/excelHelper';

const DEFAULT_JUSO_KEY = "U01TX0FVVEgyMDI1MTAxMDExNDkyNjExNjMxMTY=";
const DEFAULT_BUILDING_KEY = "a80d7fbe3842d32f845889a352543d38fde0cf1625508e615c3fbf5705d36578";
const ADMIN_PASSWORD = "0210";

const App: React.FC = () => {
  // --- States ---
  const [apiSettings, setApiSettings] = useState<ApiSettings>(() => {
    const saved = localStorage.getItem('api_settings');
    if (saved) return JSON.parse(saved);
    return { 
      jusoApiKey: DEFAULT_JUSO_KEY, 
      buildingApiKey: DEFAULT_BUILDING_KEY 
    };
  });

  const [showSettings, setShowSettings] = useState(false);
  const [isAuthVerified, setIsAuthVerified] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState(false);

  const [showExportConfig, setShowExportConfig] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualInputText, setManualInputText] = useState("");
  const [selectedRawData, setSelectedRawData] = useState<any[] | null>(null);
  const [rows, setRows] = useState<ProcessingRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [viewConfig, setViewConfig] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [exportConfig, setExportConfig] = useState<ColumnConfig[]>(() => 
    DEFAULT_COLUMNS.map(col => ({ ...col, enabled: true }))
  );
  const [configTab, setConfigTab] = useState<'view' | 'export'>('view');
  const [error, setError] = useState<string | null>(null);

  // --- Handlers ---
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthVerified(true);
      setAuthError(false);
    } else {
      setAuthError(true);
      setPasswordInput("");
      setTimeout(() => setAuthError(false), 2000);
    }
  };

  const closeSettings = () => {
    setShowSettings(false);
    setIsAuthVerified(false);
    setPasswordInput("");
    setAuthError(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const addresses = await parseAddressesFromFile(file);
      const newRows: ProcessingRow[] = addresses.map((addr, idx) => ({
        id: Date.now() + idx,
        originalAddress: addr,
        status: 'idle'
      }));
      setRows(prev => [...prev, ...newRows]);
      setError(null);
      // Reset input value to allow uploading the same file again
      e.target.value = '';
    } catch (err) {
      setError("파일을 읽는 도중 오류가 발생했습니다.");
    }
  };

  const handleManualInputSubmit = () => {
    if (!manualInputText.trim()) return;

    const addresses = manualInputText
      .split('\n')
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0);

    if (addresses.length === 0) return;

    const newRows: ProcessingRow[] = addresses.map((addr, idx) => ({
      id: Date.now() + idx,
      originalAddress: addr,
      status: 'idle'
    }));

    setRows(prev => [...prev, ...newRows]);
    setManualInputText("");
    setShowManualInput(false);
    setError(null);
  };

  const saveSettings = (newSettings: ApiSettings) => {
    setApiSettings(newSettings);
    localStorage.setItem('api_settings', JSON.stringify(newSettings));
    closeSettings();
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isProcessing, startTime]);

  const startProcessing = async () => {
    if (!apiSettings.jusoApiKey || !apiSettings.buildingApiKey) {
      setError("설정에서 API 키를 먼저 확인해주세요.");
      setShowSettings(true);
      return;
    }

    setIsProcessing(true);
    setStartTime(Date.now());
    setElapsedTime(0);
    setError(null);

    const rowsToProcess = [...rows];
    for (let i = 0; i < rowsToProcess.length; i++) {
      if (rowsToProcess[i].status === 'success') continue;

      setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'processing' } : r));

      try {
        const addrData = await getAddressInfo(apiSettings.jusoApiKey, rowsToProcess[i].originalAddress);
        
        if (addrData.error) {
          setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', message: addrData.error } : r));
          continue;
        }

        const { processed, raw } = await getBuildingRegistry(
          apiSettings.buildingApiKey,
          addrData.sigunguCd,
          addrData.bjdongCd,
          addrData.bun,
          addrData.ji
        );

        if (processed['상태'] !== '성공') {
          setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', message: processed['상태'], addressData: addrData, rawBuildingData: raw } : r));
        } else {
          setRows(prev => prev.map((r, idx) => idx === i ? { 
            ...r, 
            status: 'success', 
            addressData: addrData, 
            buildingData: processed,
            rawBuildingData: raw
          } : r));
        }
      } catch (err) {
        setRows(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', message: '요청 실패' } : r));
      }
      
      await new Promise(res => setTimeout(res, 300));
    }

    setIsProcessing(false);
  };

  const clearData = () => {
    if (window.confirm("불러온 데이터를 삭제하시겠습니까?")) {
      setRows([]);
    }
  };

  const moveColumn = (index: number, direction: 'up' | 'down', type: 'view' | 'export') => {
    const config = type === 'view' ? viewConfig : exportConfig;
    const setConfig = type === 'view' ? setViewConfig : setExportConfig;
    
    const newConfig = [...config];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newConfig.length) return;

    const currentOrder = newConfig[index].order;
    newConfig[index].order = newConfig[targetIndex].order;
    newConfig[targetIndex].order = currentOrder;

    setConfig(newConfig.sort((a, b) => a.order - b.order));
  };

  const toggleColumn = (key: string, type: 'view' | 'export') => {
    const setConfig = type === 'view' ? setViewConfig : setExportConfig;
    setConfig(prev => prev.map(c => c.key === key ? { ...c, enabled: !c.enabled } : c));
  };

  const completedCount = rows.filter(r => r.status === 'success' || r.status === 'error').length;
  const successCount = rows.filter(r => r.status === 'success').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 hidden sm:block">건축물대장 연면적 조회 서비스</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
              title="설정"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowExportConfig(true)}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
              title="항목 설정"
            >
              <ListFilter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Actions Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">1단계: 양식준비</h3>
              <p className="text-xs text-slate-400 mb-4">엑셀 양식을 받아 주소를 A열에 넣으세요.</p>
            </div>
            <button 
              onClick={downloadTemplate}
              className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors text-sm"
            >
              <Download className="w-4 h-4" /> 양식 다운로드
            </button>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">2단계: 주소입력</h3>
              <p className="text-xs text-slate-400 mb-4">파일을 업로드하거나 직접 입력하세요.</p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-medium transition-colors cursor-pointer text-sm">
                <FileUp className="w-4 h-4" /> 파일 업로드
                <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
              </label>
              <button 
                onClick={() => setShowManualInput(true)}
                className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg font-medium transition-colors text-sm"
              >
                <X className="w-4 h-4 rotate-45" /> 직접 입력하기
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">3단계: API 조회</h3>
              <p className="text-xs text-slate-400 mb-4">건축물 정보를 실시간으로 가져옵니다.</p>
            </div>
            <button 
              onClick={startProcessing}
              disabled={isProcessing || rows.length === 0}
              className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors shadow-sm text-sm"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} 
              조회 시작
            </button>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">4단계: 결과저장</h3>
              <p className="text-xs text-slate-400 mb-4">설정한 열 구성으로 엑셀을 저장합니다.</p>
            </div>
            <button 
              onClick={() => downloadResults(rows, exportConfig)}
              disabled={isProcessing || rows.length === 0}
              className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors shadow-sm text-sm"
            >
              <Download className="w-4 h-4" /> 엑셀 다운로드
            </button>
          </div>
        </div>

        {/* Status Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Progress Bar */}
        {rows.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">전체 진행률</span>
                <span className="text-xs text-slate-400">({completedCount} / {rows.length})</span>
                {elapsedTime > 0 && (
                  <span className="text-xs text-indigo-500 font-medium ml-2">
                    소요 시간: {Math.floor(elapsedTime / 60)}분 {elapsedTime % 60}초
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-indigo-600">{Math.round((completedCount / rows.length) * 100)}%</span>
                <button onClick={clearData} className="text-slate-400 hover:text-red-500 ml-2 p-1 rounded-md hover:bg-red-50 transition-colors" title="데이터 초기화">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${(completedCount / rows.length) * 100}%` }}
              ></div>
            </div>
            <div className="flex gap-4 mt-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> 성공: {successCount}
              </div>
              <div className="flex items-center gap-1.5 text-red-600">
                <div className="w-2 h-2 rounded-full bg-red-500"></div> 실패: {rows.filter(r => r.status === 'error').length}
              </div>
              <div className="flex items-center gap-1.5 text-indigo-500">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div> 처리중: {rows.filter(r => r.status === 'processing').length}
              </div>
            </div>
          </div>
        )}

        {/* Results Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-700 w-16">번호</th>
                  {viewConfig.filter(c => c.enabled).map(col => (
                    <th key={col.key} className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={viewConfig.filter(c => c.enabled).length + 1} className="px-4 py-20 text-center text-slate-400">
                      <FileUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      데이터가 없습니다. 파일을 업로드해 주세요.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                      {viewConfig.filter(c => c.enabled).map(col => {
                        if (col.key === 'originalAddress') {
                          return <td key={col.key} className="px-4 py-3 font-medium text-slate-700 whitespace-normal min-w-[200px]">{row.originalAddress}</td>;
                        }
                        if (col.key === 'roadAddr') {
                          return <td key={col.key} className="px-4 py-3 text-slate-600 whitespace-normal min-w-[200px]">{row.addressData?.roadAddr || '-'}</td>;
                        }
                        if (col.key === '상태') {
                          return (
                            <td key={col.key} className="px-4 py-3">
                              {row.status === 'idle' && <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 uppercase">대기</span>}
                              {row.status === 'processing' && <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> 조회중</span>}
                              {row.status === 'success' && (
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> 성공
                                  </span>
                                  <button 
                                    onClick={() => setSelectedRawData(row.rawBuildingData || [])}
                                    className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-400 hover:text-slate-600"
                                    title="원본 데이터(JSON) 보기"
                                  >
                                    <Code className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                              {row.status === 'error' && (
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700">
                                    <AlertCircle className="w-3 h-3 mr-1" /> 실패
                                  </span>
                                  {row.rawBuildingData && row.rawBuildingData.length > 0 && (
                                    <button 
                                      onClick={() => setSelectedRawData(row.rawBuildingData || [])}
                                      className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-400 hover:text-slate-600"
                                      title="원본 데이터(JSON) 보기"
                                    >
                                      <Code className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        }
                        if (col.key === 'message') {
                          const info = row.buildingData?.['_info'];
                          const displayMessage = [row.message, info].filter(Boolean).join(' / ') || (row.status === 'error' ? '건물 정보 없음' : '');
                          return <td key={col.key} className="px-4 py-3 text-slate-400 text-xs italic truncate max-w-xs">{displayMessage}</td>;
                        }
                        
                        let value = '-';
                        if (row.addressData && col.key in row.addressData) {
                          value = (row.addressData as any)[col.key] || '-';
                        } else if (row.buildingData && col.key in row.buildingData) {
                          value = row.buildingData[col.key] || '-';
                        }

                        if ((col.key === '연면적' || col.key === '부속건축물면적' || col.key === '대지면적' || col.key === '건축면적' || col.key === '총연면적') && value !== '-') {
                          const numValue = parseFloat(value);
                          return (
                            <td key={col.key} className="px-4 py-3 text-slate-900 font-bold">
                              {isNaN(numValue) ? value : numValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          );
                        }

                        if (col.key === '사용승인일' && value !== '-' && value.length === 8) {
                          const formattedDate = `${value.substring(0, 4)}-${value.substring(4, 6)}-${value.substring(6, 8)}`;
                          return <td key={col.key} className="px-4 py-3 text-slate-600 whitespace-nowrap">{formattedDate}</td>;
                        }

                        return <td key={col.key} className="px-4 py-3 text-slate-600 whitespace-nowrap">{value}</td>;
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Settings Modal with Password Protection */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          {!isAuthVerified ? (
            <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 animate-in fade-in zoom-in duration-200 ${authError ? 'animate-bounce border-2 border-red-500' : ''}`}>
              <div className="flex flex-col items-center mb-6">
                <div className="p-4 bg-indigo-100 rounded-full mb-4">
                  <Lock className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">관리자 인증</h2>
                <p className="text-sm text-slate-500 mt-1">API 설정을 변경하려면 비밀번호를 입력하세요.</p>
              </div>
              
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <input 
                    type="password" 
                    autoFocus
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••"
                    className={`w-full px-4 py-3 bg-slate-50 border text-center text-2xl tracking-widest rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${authError ? 'border-red-500' : 'border-slate-200'}`}
                  />
                  {authError && <p className="text-center text-xs text-red-500 mt-2 font-semibold">비밀번호가 일치하지 않습니다.</p>}
                </div>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={closeSettings}
                    className="flex-1 py-3 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    닫기
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95"
                  >
                    확인
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                  <h2 className="text-xl font-bold text-slate-900">API 설정 관리</h2>
                </div>
                <button onClick={closeSettings} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                saveSettings({
                  jusoApiKey: formData.get('juso') as string,
                  buildingApiKey: formData.get('building') as string,
                });
              }} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">행정안전부 주소 API 키</label>
                  <input 
                    name="juso"
                    type="text" 
                    defaultValue={apiSettings.jusoApiKey}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-mono"
                    required
                  />
                  <p className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">주소 검색 시 사용되는 API 키입니다. (juso.go.kr)</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">공공데이터포털 건축물대장 API 키</label>
                  <input 
                    name="building"
                    type="text" 
                    defaultValue={apiSettings.buildingApiKey}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-mono"
                    required
                  />
                  <p className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">건축물대장 정보를 가져오는 서비스 키입니다. (data.go.kr)</p>
                </div>
                <div className="pt-2 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsAuthVerified(false)}
                    className="flex-1 py-3 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    로그아웃
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
                  >
                    변경사항 저장
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Manual Input Modal */}
      {showManualInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <X className="w-5 h-5 text-indigo-600 rotate-45" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">주소 직접 입력</h2>
              </div>
              <button onClick={() => setShowManualInput(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-slate-500 mb-4">조회할 주소를 한 줄에 하나씩 입력해 주세요. 여러 개를 동시에 붙여넣을 수 있습니다.</p>
            
            <textarea 
              autoFocus
              value={manualInputText}
              onChange={(e) => setManualInputText(e.target.value)}
              placeholder="예시:&#10;서울특별시 강남구 언주로 840&#10;강원특별자치도 원주시 소초면 북원로 3223"
              className="w-full h-64 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-sans resize-none mb-4"
            />
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowManualInput(false)}
                className="flex-1 py-3 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
              >
                취소
              </button>
              <button 
                onClick={handleManualInputSubmit}
                disabled={!manualInputText.trim()}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
              >
                목록에 추가하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Config Modal */}
      {showExportConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ListFilter className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-bold text-slate-900">항목 및 순서 설정</h2>
              </div>
              <button onClick={() => setShowExportConfig(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex border-b border-slate-100 mb-6">
              <button 
                onClick={() => setConfigTab('view')}
                className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 ${configTab === 'view' ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
              >
                화면 표시 설정
              </button>
              <button 
                onClick={() => setConfigTab('export')}
                className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 ${configTab === 'export' ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
              >
                엑셀 다운로드 설정
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              {configTab === 'view' 
                ? '화면 테이블에 표시될 항목을 선택하고 순서를 조정합니다.' 
                : '엑셀 파일로 저장될 항목을 선택하고 순서를 조정합니다.'}
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {(configTab === 'view' ? viewConfig : exportConfig).map((col, index) => (
                <div key={col.key} className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${col.enabled ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                  <div className="flex flex-col gap-1 mr-2">
                    <button 
                      onClick={() => moveColumn(index, 'up', configTab)}
                      disabled={index === 0}
                      className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => moveColumn(index, 'down', configTab)}
                      disabled={index === (configTab === 'view' ? viewConfig : exportConfig).length - 1}
                      className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="relative flex items-center h-6">
                    <input 
                      type="checkbox" 
                      id={`col-${configTab}-${col.key}`}
                      checked={col.enabled}
                      onChange={() => toggleColumn(col.key, configTab)}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                  <label htmlFor={`col-${configTab}-${col.key}`} className={`flex-1 text-sm font-bold cursor-pointer transition-colors ${col.enabled ? 'text-slate-800' : 'text-slate-400'}`}>
                    {col.label}
                  </label>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono uppercase">Pos: {index + 1}</span>
                </div>
              ))}
            </div>

            <div className="pt-6">
              <button 
                onClick={() => setShowExportConfig(false)}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95"
              >
                설정 완료
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Raw JSON Modal */}
      {selectedRawData !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">원본 API 응답 데이터 (JSON)</h2>
                <p className="text-sm text-slate-500 mt-1">건축물대장 표제부 API에서 반환된 원본 데이터 리스트입니다.</p>
              </div>
              <button 
                onClick={() => setSelectedRawData(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-slate-900 text-emerald-400 font-mono text-sm">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(selectedRawData, null, 2)}
              </pre>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button 
                onClick={() => setSelectedRawData(null)}
                className="px-6 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
