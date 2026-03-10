import React, { useState } from 'react';
import { CalculationResult, EstimateInput } from '../utils/calculations';
import { formatCurrency, cn } from '../lib/utils';
import { COMPANY_INFO } from '../constants/data';

interface EstimateViewProps {
    result: CalculationResult;
    input: EstimateInput;
}

export function EstimateView({ result, input }: EstimateViewProps) {
    const [activeTab, setActiveTab] = useState('sheet1');

    if (!result.gradeData) {
        return (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mt-6 text-center">
                <p className="text-gray-500">연면적을 입력하면 견적 결과가 표시됩니다.</p>
            </div>
        );
    }

    const tabs = [
        { id: 'sheet1', label: '1. 견적서(갑)' },
        { id: 'sheet2', label: '2. 성능점검 산출' },
        { id: 'sheet3', label: '3. 유지점검 산출' },
        { id: 'sheet4', label: '4. 선임 산출' },
        { id: 'sheet6', label: '5. 수량내역서' },
        { id: 'sheet5', label: '6. 업무절차' },
        { id: 'json', label: 'JSON 출력' },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-6 overflow-hidden">
            <div className="border-b border-gray-200 overflow-x-auto">
                <nav className="flex min-w-max">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "px-6 py-4 text-sm font-medium border-b-2 transition-colors",
                                activeTab === tab.id
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="p-6">
                {activeTab === 'sheet1' && <Sheet1Estimate result={result} input={input} />}
                {activeTab === 'sheet2' && <Sheet2Performance result={result} />}
                {activeTab === 'sheet3' && <Sheet3Maintenance result={result} />}
                {activeTab === 'sheet4' && <Sheet4Entrustment result={result} />}
                {activeTab === 'sheet6' && <Sheet6Quantity result={result} />}
                {activeTab === 'sheet5' && <Sheet5Procedure />}
                {activeTab === 'json' && <JsonOutput result={result} input={input} />}
            </div>
        </div>
    );
}

function Sheet1Estimate({ result, input }: { result: CalculationResult; input: EstimateInput }) {
    return (
        <div className="max-w-4xl mx-auto border border-gray-300 p-8 bg-white">
            <h1 className="text-3xl font-bold text-center mb-8 underline decoration-double underline-offset-4">견 적 서</h1>

            <div className="flex justify-between mb-8">
                <div className="w-1/2 space-y-2">
                    <div className="flex"><span className="w-24 font-bold">건 명:</span> <span>정보통신설비 유지보수관리 용역</span></div>
                    <div className="flex"><span className="w-24 font-bold">대 상 처:</span> <span>{input.customerName}</span></div>
                    <div className="flex"><span className="w-24 font-bold">견적금액:</span> <span className="text-xl font-bold">일금 {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(result.totalYearlyAmount).replace('₩', '')} 원정 (VAT 별도)</span></div>
                </div>
                <div className="w-1/2 border border-gray-400 p-4 text-sm">
                    <div className="grid grid-cols-[80px_1fr] gap-1">
                        <div className="font-bold">등록번호:</div><div>{COMPANY_INFO.bizNumber}</div>
                        <div className="font-bold">상 호:</div><div>{COMPANY_INFO.name}</div>
                        <div className="font-bold">대 표 자:</div><div>{COMPANY_INFO.ceo}</div>
                        <div className="font-bold">주 소:</div><div>{COMPANY_INFO.address}</div>
                        <div className="font-bold">업 태:</div><div>{COMPANY_INFO.bizType}</div>
                        <div className="font-bold">종 목:</div><div>{COMPANY_INFO.bizItem}</div>
                    </div>
                </div>
            </div>

            <table className="w-full border-collapse border border-gray-400 mb-8 text-sm">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-gray-400 p-2">품명</th>
                        <th className="border border-gray-400 p-2">규격</th>
                        <th className="border border-gray-400 p-2">단위</th>
                        <th className="border border-gray-400 p-2">수량</th>
                        <th className="border border-gray-400 p-2">단가</th>
                        <th className="border border-gray-400 p-2">금액</th>
                        <th className="border border-gray-400 p-2">비고</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="border border-gray-400 p-2">성능점검</td>
                        <td className="border border-gray-400 p-2 text-center">1회/년</td>
                        <td className="border border-gray-400 p-2 text-center">식</td>
                        <td className="border border-gray-400 p-2 text-center">1</td>
                        <td className="border border-gray-400 p-2 text-right">{formatCurrency(result.performanceCost.finalAmount)}</td>
                        <td className="border border-gray-400 p-2 text-right">{formatCurrency(result.performanceCost.finalAmount)}</td>
                        <td className="border border-gray-400 p-2"></td>
                    </tr>
                    <tr>
                        <td className="border border-gray-400 p-2">유지보수관리점검</td>
                        <td className="border border-gray-400 p-2 text-center">2회/년</td>
                        <td className="border border-gray-400 p-2 text-center">식</td>
                        <td className="border border-gray-400 p-2 text-center">1</td>
                        <td className="border border-gray-400 p-2 text-right">{formatCurrency(result.maintenanceCost.finalAmount)}</td>
                        <td className="border border-gray-400 p-2 text-right">{formatCurrency(result.maintenanceCost.finalAmount)}</td>
                        <td className="border border-gray-400 p-2"></td>
                    </tr>
                    <tr>
                        <td className="border border-gray-400 p-2">유지관리자 위탁선임</td>
                        <td className="border border-gray-400 p-2 text-center">비상주</td>
                        <td className="border border-gray-400 p-2 text-center">월</td>
                        <td className="border border-gray-400 p-2 text-center">12</td>
                        <td className="border border-gray-400 p-2 text-right">{formatCurrency(result.entrustmentCost.monthlyUnit)}</td>
                        <td className="border border-gray-400 p-2 text-right">{formatCurrency(result.entrustmentCost.total)}</td>
                        <td className="border border-gray-400 p-2"></td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr className="bg-gray-50 font-bold">
                        <td colSpan={5} className="border border-gray-400 p-2 text-center">합 계 (VAT 별도)</td>
                        <td className="border border-gray-400 p-2 text-right">{formatCurrency(result.totalYearlyAmount)}</td>
                        <td className="border border-gray-400 p-2"></td>
                    </tr>
                </tfoot>
            </table>

            <div className="text-sm space-y-1">
                <p>1. 견적 유효기간: {COMPANY_INFO.validity}</p>
                <p>2. 점검 항목: {COMPANY_INFO.items}</p>
                <p>3. 특기사항: 상기 견적은 부가세 별도 금액입니다.</p>
            </div>
        </div>
    );
}

function Sheet2Performance({ result }: { result: CalculationResult }) {
    const { performanceCost: cost, grade } = result;
    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold mb-4">2. 성능점검비용 산출내역서</h2>
            <div className="mb-4 text-sm">
                <span className="font-bold mr-4">적용등급:</span> {grade}
            </div>
            <table className="w-full border-collapse border border-gray-400 text-sm">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-gray-400 p-2">구분</th>
                        <th className="border border-gray-400 p-2">산출식</th>
                        <th className="border border-gray-400 p-2">금액(원)</th>
                        <th className="border border-gray-400 p-2">비고</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="border border-gray-400 p-2">1. 직접인건비</td>
                        <td className="border border-gray-400 p-2">등급별 인원 × 노임단가</td>
                        <td className="border border-gray-400 p-2 text-right">{formatCurrency(cost.laborCost)}</td>
                        <td className="border border-gray-400 p-2"></td>
                    </tr>
                    <tr>
                        <td className="border border-gray-400 p-2">2. 직접경비</td>
                        <td className="border border-gray-400 p-2">직접인건비 × 10%</td>
                        <td className="border border-gray-400 p-2 text-right">{formatCurrency(cost.directExpense)}</td>
                        <td className="border border-gray-400 p-2"></td>
                    </tr>
                    <tr>
                        <td className="border border-gray-400 p-2">3. 제경비</td>
                        <td className="border border-gray-400 p-2">직접인건비 × 110%</td>
                        <td className="border border-gray-400 p-2 text-right">{formatCurrency(cost.overhead)}</td>
                        <td className="border border-gray-400 p-2"></td>
                    </tr>
                    <tr>
                        <td className="border border-gray-400 p-2">4. 기술료</td>
                        <td className="border border-gray-400 p-2">(직접인건비 + 제경비) × 20%</td>
                        <td className="border border-gray-400 p-2 text-right">{formatCurrency(cost.techFee)}</td>
                        <td className="border border-gray-400 p-2"></td>
                    </tr>
                    <tr className="bg-gray-50 font-bold">
                        <td className="border border-gray-400 p-2">소 계</td>
                        <td className="border border-gray-400 p-2">1 + 2 + 3 + 4</td>
                        <td className="border border-gray-400 p-2 text-right">{formatCurrency(cost.subtotal)}</td>
                        <td className="border border-gray-400 p-2"></td>
                    </tr>
                    <tr>
                        <td className="border border-gray-400 p-2 text-red-600">조정금액</td>
                        <td className="border border-gray-400 p-2">목표금액 - 소계</td>
                        <td className="border border-gray-400 p-2 text-right text-red-600">{formatCurrency(cost.adjustmentAmount)}</td>
                        <td className="border border-gray-400 p-2">단가표 기준 맞춤</td>
                    </tr>
                    <tr className="bg-blue-50 font-bold text-blue-900">
                        <td className="border border-gray-400 p-2">합 계</td>
                        <td className="border border-gray-400 p-2">소계 + 조정금액</td>
                        <td className="border border-gray-400 p-2 text-right">{formatCurrency(cost.finalAmount)}</td>
                        <td className="border border-gray-400 p-2"></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

function Sheet3Maintenance({ result }: { result: CalculationResult }) {
    const { maintenanceCost: cost, grade } = result;
    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold mb-4">3. 유지점검비용 산출내역서</h2>
            <div className="mb-4 text-sm">
                <span className="font-bold mr-4">적용등급:</span> {grade}
            </div>
            <table className="w-full border-collapse border border-gray-400 text-sm">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-gray-400 p-2">구분</th>
                        <th className="border border-gray-400 p-2">산출식</th>
                        <th className="border border-gray-400 p-2">금액(원)</th>
                        <th className="border border-gray-400 p-2">비고</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="border border-gray-400 p-2">1. 직접인건비</td>
                        <td className="border border-gray-400 p-2">등급별 인원 × 노임단가</td>
                        <td className="border border-gray-400 p-2 text-right">{formatCurrency(cost.laborCost)}</td>
                        <td className="border border-gray-400 p-2"></td>
                    </tr>
                    <tr>
                        <td className="border border-gray-400 p-2">2. 직접경비</td>
                        <td className="border border-gray-400 p-2">직접인건비 × 10%</td>
                        <td className="border border-gray-400 p-2 text-right">{formatCurrency(cost.directExpense)}</td>
                        <td className="border border-gray-400 p-2"></td>
                    </tr>
                    <tr>
                        <td className="border border-gray-400 p-2">3. 제경비</td>
                        <td className="border border-gray-400 p-2">직접인건비 × 110%</td>
                        <td className="border border-gray-400 p-2 text-right">{formatCurrency(cost.overhead)}</td>
                        <td className="border border-gray-400 p-2"></td>
                    </tr>
                    <tr>
                        <td className="border border-gray-400 p-2">4. 기술료</td>
                        <td className="border border-gray-400 p-2">(직접인건비 + 제경비) × 20%</td>
                        <td className="border border-gray-400 p-2 text-right">{formatCurrency(cost.techFee)}</td>
                        <td className="border border-gray-400 p-2"></td>
                    </tr>
                    <tr className="bg-gray-50 font-bold">
                        <td className="border border-gray-400 p-2">소 계</td>
                        <td className="border border-gray-400 p-2">1 + 2 + 3 + 4</td>
                        <td className="border border-gray-400 p-2 text-right">{formatCurrency(cost.subtotal)}</td>
                        <td className="border border-gray-400 p-2"></td>
                    </tr>
                    <tr>
                        <td className="border border-gray-400 p-2 text-red-600">조정금액</td>
                        <td className="border border-gray-400 p-2">목표금액 - 소계</td>
                        <td className="border border-gray-400 p-2 text-right text-red-600">{formatCurrency(cost.adjustmentAmount)}</td>
                        <td className="border border-gray-400 p-2">단가표 기준 맞춤</td>
                    </tr>
                    <tr className="bg-blue-50 font-bold text-blue-900">
                        <td className="border border-gray-400 p-2">합 계</td>
                        <td className="border border-gray-400 p-2">소계 + 조정금액</td>
                        <td className="border border-gray-400 p-2 text-right">{formatCurrency(cost.finalAmount)}</td>
                        <td className="border border-gray-400 p-2"></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

function Sheet4Entrustment({ result }: { result: CalculationResult }) {
    const { entrustmentCost: cost, grade } = result;
    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold mb-4">4. 유지관리자 위탁선임비용 산출내역서</h2>
            <div className="mb-4 text-sm">
                <span className="font-bold mr-4">적용등급:</span> {grade}
            </div>
            <table className="w-full border-collapse border border-gray-400 text-sm">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-gray-400 p-2">구분</th>
                        <th className="border border-gray-400 p-2">산출내역</th>
                        <th className="border border-gray-400 p-2">금액(원)</th>
                        <th className="border border-gray-400 p-2">비고</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="border border-gray-400 p-2">월 위탁수수료</td>
                        <td className="border border-gray-400 p-2">등급별 월 단가</td>
                        <td className="border border-gray-400 p-2 text-right">{formatCurrency(cost.monthlyUnit)}</td>
                        <td className="border border-gray-400 p-2"></td>
                    </tr>
                    <tr>
                        <td className="border border-gray-400 p-2">기간</td>
                        <td className="border border-gray-400 p-2">12개월</td>
                        <td className="border border-gray-400 p-2 text-center">12</td>
                        <td className="border border-gray-400 p-2"></td>
                    </tr>
                    <tr className="bg-blue-50 font-bold text-blue-900">
                        <td className="border border-gray-400 p-2">연간 합계</td>
                        <td className="border border-gray-400 p-2">월 단가 × 12</td>
                        <td className="border border-gray-400 p-2 text-right">{formatCurrency(cost.total)}</td>
                        <td className="border border-gray-400 p-2"></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

function Sheet5Procedure() {
    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold mb-6">정보통신설비 유지보수·관리 업무처리 절차</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="font-bold text-lg mb-4 text-blue-800 border-b pb-2 border-blue-200">유지보수관리 절차</h3>
                    <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700">
                        <li>유지보수관리 자료 구비 <span className="text-gray-500 text-xs">(정보통신설비 유지보수관리기준 제6조)</span></li>
                        <li>자체관리 또는 관리위탁 <span className="text-gray-500 text-xs">(공사업자)</span></li>
                        <li>지자체에 선·해임 신고</li>
                        <li>유지보수관리 및 성능점검 계획 수립 <span className="text-gray-500 text-xs">(최초 점검 실시 전, 기준 제7조)</span></li>
                        <li>정보통신설비 유지보수관리 실시 <span className="text-gray-500 text-xs">(반기별 1회 이상 기록, 기준 제8조)</span></li>
                    </ol>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="font-bold text-lg mb-4 text-green-800 border-b pb-2 border-green-200">성능점검 절차</h3>
                    <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700">
                        <li>성능점검 자료 구비 <span className="text-gray-500 text-xs">(기준 제6조)</span></li>
                        <li>자체점검 또는 점검대행 <span className="text-gray-500 text-xs">(공사업자·용역업자)</span></li>
                        <li>성능점검 계획 수립 <span className="text-gray-500 text-xs">(최초 점검 실시 전, 기준 제7조)</span></li>
                        <li>정보통신설비 성능점검 실시 <span className="text-gray-500 text-xs">(매년 1회 이상, 기준 제10조 제1항)</span></li>
                        <li>성능점검표 기록 및 보존 <span className="text-gray-500 text-xs">(5년, 기준 제10조 제4항)</span></li>
                        <li>시·군·구청장 요청 시 제출 <span className="text-gray-500 text-xs">(기준 제10조 제5항)</span></li>
                    </ol>
                </div>
            </div>
        </div>
    );
}

function Sheet6Quantity({ result }: { result: CalculationResult }) {
    const { quantityBill, adjustmentCoefficient } = result;

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold mb-4">5. 성능점검 수량내역서</h2>
            <div className="mb-4 text-sm flex gap-6">
                <div><span className="font-bold mr-2">조정계수:</span> {adjustmentCoefficient}</div>
                <div><span className="font-bold mr-2">총 산출인원:</span> {quantityBill.totalManpower.toFixed(2)}인</div>
                <div><span className="font-bold mr-2 text-blue-600">최종 투입인원:</span> {quantityBill.roundedManpower}인 (소수점 버림)</div>
            </div>

            <table className="w-full border-collapse border border-gray-400 text-sm">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-gray-400 p-2">분류</th>
                        <th className="border border-gray-400 p-2">설비명</th>
                        <th className="border border-gray-400 p-2">기준인원</th>
                        <th className="border border-gray-400 p-2">조정인원 (기준×계수)</th>
                    </tr>
                </thead>
                <tbody>
                    {quantityBill.items.map((item, idx) => (
                        <tr key={idx}>
                            <td className="border border-gray-400 p-2 text-center text-gray-500">{item.category}</td>
                            <td className="border border-gray-400 p-2">{item.name}</td>
                            <td className="border border-gray-400 p-2 text-center">{item.standardManpower.toFixed(2)}</td>
                            <td className="border border-gray-400 p-2 text-center font-medium">{item.adjustedManpower.toFixed(2)}</td>
                        </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                        <td colSpan={3} className="border border-gray-400 p-2 text-center">합 계</td>
                        <td className="border border-gray-400 p-2 text-center">{quantityBill.totalManpower.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

function JsonOutput({ result, input }: { result: CalculationResult; input: EstimateInput }) {
    const jsonOutput = {
        "sheet1_견적서": {
            "견적일": new Date().toISOString().split('T')[0],
            "고객명": input.customerName,
            "주소": input.address,
            "연면적": input.area,
            "주용도": input.usage,
            "사용승인일": input.approvalDate,
            "담당자명": input.contactName,
            "담당자연락처": input.contactPhone,
            "건물등급": result.grade,
            "성능점검금액": result.performanceCost.finalAmount,
            "유지점검금액": result.maintenanceCost.finalAmount,
            "선임위탁금액": result.entrustmentCost.total,
            "연간총견적금액": result.totalYearlyAmount,
            "월견적금액": result.monthlyAmount
        },
        "sheet2_성능점검산출": result.performanceCost,
        "sheet3_유지점검산출": result.maintenanceCost,
        "sheet4_선임산출": result.entrustmentCost,
        "sheet5_업무절차": "고정콘텐츠(화면참조)",
        "sheet6_수량내역": result.quantityBill
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold mb-4">JSON 데이터 출력</h2>
            <textarea
                className="w-full h-96 p-4 font-mono text-sm border border-gray-300 rounded-lg bg-gray-50"
                readOnly
                value={JSON.stringify(jsonOutput, null, 2)}
            />
        </div>
    );
}
