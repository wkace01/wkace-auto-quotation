import {
    AREA_GRADE_TABLE,
    ADJUSTMENT_COEFFICIENTS,
    LABOR_COSTS,
    FACILITY_ITEMS,
    AreaGradeData,
    FacilityItem
} from '../constants/data';

export interface EstimateInput {
    customerName: string;
    address: string;
    area: number;
    usage: string;
    approvalDate: string;
    contactName: string;
    contactPhone: string;
    salesRep: string;
    selectedFacilities: string[]; // List of facility names
}

export interface CalculationResult {
    gradeData: AreaGradeData | null;
    adjustmentCoefficient: number;
    grade: string;

    // Sheet 2: Performance Inspection
    performanceCost: {
        laborCost: number;
        directExpense: number;
        overhead: number;
        techFee: number;
        subtotal: number;
        targetAmount: number;
        adjustmentAmount: number;
        finalAmount: number;
    };

    // Sheet 3: Maintenance Inspection
    maintenanceCost: {
        laborCost: number;
        directExpense: number;
        overhead: number;
        techFee: number;
        subtotal: number;
        targetAmount: number;
        adjustmentAmount: number;
        finalAmount: number;
    };

    // Sheet 4: Entrustment
    entrustmentCost: {
        monthlyUnit: number;
        months: number;
        count: number;
        total: number;
    };

    // Sheet 6: Quantity
    quantityBill: {
        items: {
            name: string;
            category: string;
            standardManpower: number;
            adjustedManpower: number;
        }[];
        totalManpower: number;
        roundedManpower: number;
    };

    // Summary
    totalYearlyAmount: number;
    monthlyAmount: number;
}

export function calculateEstimate(input: EstimateInput): CalculationResult {
    const { area, selectedFacilities } = input;

    // 1. Find Grade Data
    // Rule 1: Select largest interval where area >= min
    // However, the table is continuous. We just find the matching range.
    // 5,000 ~ 9,999 -> Index 0
    let gradeData = AREA_GRADE_TABLE.find(d => area >= d.minArea && area < d.maxArea);

    // Fallback or handle < 5000
    if (!gradeData) {
        if (area >= 60000) {
            gradeData = AREA_GRADE_TABLE[AREA_GRADE_TABLE.length - 1];
        } else {
            // Handle < 5000 case? The prompt implies 5000 is min. 
            // We will assume if < 5000 it's not applicable or use min? 
            // Prompt says "5,000 미만: 해당없음".
            // We will return null or empty result if area < 5000, but for type safety let's handle it.
            // Let's assume valid input >= 5000 for now or return a dummy.
            // If < 5000, we can't calculate.
        }
    }

    // 2. Find Adjustment Coefficient
    let adjustmentCoefficient = 1.0;
    const adjRow = ADJUSTMENT_COEFFICIENTS.find(d => area >= d.min && area < d.max);
    if (adjRow) {
        adjustmentCoefficient = adjRow.value;
    } else if (area >= 60000) {
        adjustmentCoefficient = 2.0;
    }

    if (!gradeData) {
        // Return zeroed result
        return {
            gradeData: null,
            adjustmentCoefficient: 0,
            grade: "해당없음",
            performanceCost: { laborCost: 0, directExpense: 0, overhead: 0, techFee: 0, subtotal: 0, targetAmount: 0, adjustmentAmount: 0, finalAmount: 0 },
            maintenanceCost: { laborCost: 0, directExpense: 0, overhead: 0, techFee: 0, subtotal: 0, targetAmount: 0, adjustmentAmount: 0, finalAmount: 0 },
            entrustmentCost: { monthlyUnit: 0, months: 0, count: 0, total: 0 },
            quantityBill: { items: [], totalManpower: 0, roundedManpower: 0 },
            totalYearlyAmount: 0,
            monthlyAmount: 0
        };
    }

    const laborUnitPrice = LABOR_COSTS[gradeData.grade] || 0;

    // 3. Calculate Performance Cost (Sheet 2)
    const p_laborCost = gradeData.performanceManpower * laborUnitPrice;
    const p_directExpense = p_laborCost * 0.10;
    const p_overhead = p_laborCost * 1.10; // Rule says "Direct Labor * 1.10" for overhead? 
    // Wait, Rule 2.1:
    // 3) 제경비 = 직접인건비 합계 × 1.10
    // Usually overhead is a % of labor. 110% seems high but that's what the prompt says.
    // Let's stick strictly to the prompt: "제경비 = 직접인건비 합계 × 1.10"

    const p_techFee = (p_laborCost + p_overhead) * 0.20;
    // Rule 2.1: 4) 기술료 = (직접인건비 합계 + 제경비) × 0.20

    const p_subtotal = p_laborCost + p_directExpense + p_overhead + p_techFee;
    const p_targetAmount = gradeData.yearlyPerformance;
    const p_adjustmentAmount = p_targetAmount - p_subtotal;
    const p_finalAmount = p_targetAmount;

    // 4. Calculate Maintenance Cost (Sheet 3)
    const m_laborCost = gradeData.maintenanceManpower * laborUnitPrice;
    const m_directExpense = m_laborCost * 0.10;
    const m_overhead = m_laborCost * 1.10;
    const m_techFee = (m_laborCost + m_overhead) * 0.20;
    const m_subtotal = m_laborCost + m_directExpense + m_overhead + m_techFee;
    const m_targetAmount = gradeData.yearlyMaintenance;
    const m_adjustmentAmount = m_targetAmount - m_subtotal;
    const m_finalAmount = m_targetAmount;

    // 5. Calculate Entrustment Cost (Sheet 4)
    const e_monthlyUnit = gradeData.monthlyEntrust;
    const e_total = e_monthlyUnit * 12; // 1 person, 12 months

    // 6. Quantity Bill (Sheet 6)
    const quantityItems = FACILITY_ITEMS.filter(item => selectedFacilities.includes(item.name)).map(item => {
        return {
            name: item.name,
            category: item.category,
            standardManpower: item.standardManpower,
            adjustedManpower: item.standardManpower * adjustmentCoefficient
        };
    });

    const totalManpowerRaw = quantityItems.reduce((sum, item) => sum + item.adjustedManpower, 0);
    const roundedManpower = Math.floor(totalManpowerRaw);

    // 7. Summary
    const totalYearlyAmount = p_finalAmount + m_finalAmount + e_total;
    const monthlyAmount = Math.floor(totalYearlyAmount / 12);

    return {
        gradeData,
        adjustmentCoefficient,
        grade: gradeData.grade,
        performanceCost: {
            laborCost: p_laborCost,
            directExpense: p_directExpense,
            overhead: p_overhead,
            techFee: p_techFee,
            subtotal: p_subtotal,
            targetAmount: p_targetAmount,
            adjustmentAmount: p_adjustmentAmount,
            finalAmount: p_finalAmount
        },
        maintenanceCost: {
            laborCost: m_laborCost,
            directExpense: m_directExpense,
            overhead: m_overhead,
            techFee: m_techFee,
            subtotal: m_subtotal,
            targetAmount: m_targetAmount,
            adjustmentAmount: m_adjustmentAmount,
            finalAmount: m_finalAmount
        },
        entrustmentCost: {
            monthlyUnit: e_monthlyUnit,
            months: 12,
            count: 1,
            total: e_total
        },
        quantityBill: {
            items: quantityItems,
            totalManpower: totalManpowerRaw,
            roundedManpower: roundedManpower
        },
        totalYearlyAmount,
        monthlyAmount
    };
}
