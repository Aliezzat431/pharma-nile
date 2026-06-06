"use client";

import { useState } from "react";
import {
  Upload,
  Loader2,
  Pill,
  Trash2,
  Save,
  ImageIcon,
} from "lucide-react";

interface PrescriptionItem {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
}

export default function PrescriptionScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [medicines, setMedicines] = useState<PrescriptionItem[]>([]);

  const handleFileChange = (selected: File) => {
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const scanPrescription = async () => {
    if (!file) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("prescription", file);

      const res = await fetch("/api/prescription-scan", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setMedicines(data.medicines || []);
    } catch (error: any) {
      alert(error.message || "Failed to scan prescription");
    } finally {
      setLoading(false);
    }
  };

  const updateMedicine = (
    index: number,
    field: keyof PrescriptionItem,
    value: string
  ) => {
    const copy = [...medicines];
    copy[index][field] = value;
    setMedicines(copy);
  };

  const removeMedicine = (index: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const addToPOS = async () => {
    console.log(medicines);

    alert(
      `${medicines.length} medicine(s) ready to be matched with inventory`
    );
  };

  return (
    <div className="space-y-6">

      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold mb-4 font-cairo">
          قارئ الروشتة بالذكاء الاصطناعي
        </h2>

        <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center">

          {preview ? (
            <img
              src={preview}
              alt="Prescription"
              className="max-h-[350px] mx-auto rounded-xl object-contain"
            />
          ) : (
            <div className="space-y-3">
              <ImageIcon className="w-14 h-14 mx-auto text-gray-500" />
              <p className="text-gray-400 font-cairo">
                ارفع صورة الروشتة
              </p>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="prescription-upload"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) handleFileChange(selected);
            }}
          />

          <label
            htmlFor="prescription-upload"
            className="inline-flex mt-5 cursor-pointer items-center gap-2 rounded-xl px-4 py-3 bg-white/10 hover:bg-white/20 transition"
          >
            <Upload className="w-4 h-4" />
            اختيار صورة
          </label>
        </div>

        <button
          disabled={!file || loading}
          onClick={scanPrescription}
          className="mt-4 w-full h-12 rounded-xl bg-[#00CED1] text-black font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري قراءة الروشتة...
            </>
          ) : (
            <>
              <Pill className="w-5 h-5" />
              قراءة الروشتة
            </>
          )}
        </button>
      </div>

      {medicines.length > 0 && (
        <div className="glass-card p-6">

          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold font-cairo">
              الأدوية المستخرجة
            </h3>

            <button
              onClick={addToPOS}
              className="bg-green-500/20 border border-green-500 px-4 py-2 rounded-lg text-green-400 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              إضافة للسلة
            </button>
          </div>

          <div className="overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-3 text-right">الدواء</th>
                  <th className="p-3 text-right">الجرعة</th>
                  <th className="p-3 text-right">التكرار</th>
                  <th className="p-3 text-right">المدة</th>
                  <th className="p-3 text-right">ملاحظات</th>
                  <th className="p-3"></th>
                </tr>
              </thead>

              <tbody>
                {medicines.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-white/5"
                  >
                    <td className="p-2">
                      <input
                        value={item.medicine_name}
                        onChange={(e) =>
                          updateMedicine(
                            index,
                            "medicine_name",
                            e.target.value
                          )
                        }
                        className="w-full bg-white/5 rounded-lg p-2"
                      />
                    </td>

                    <td className="p-2">
                      <input
                        value={item.dosage}
                        onChange={(e) =>
                          updateMedicine(
                            index,
                            "dosage",
                            e.target.value
                          )
                        }
                        className="w-full bg-white/5 rounded-lg p-2"
                      />
                    </td>

                    <td className="p-2">
                      <input
                        value={item.frequency}
                        onChange={(e) =>
                          updateMedicine(
                            index,
                            "frequency",
                            e.target.value
                          )
                        }
                        className="w-full bg-white/5 rounded-lg p-2"
                      />
                    </td>

                    <td className="p-2">
                      <input
                        value={item.duration}
                        onChange={(e) =>
                          updateMedicine(
                            index,
                            "duration",
                            e.target.value
                          )
                        }
                        className="w-full bg-white/5 rounded-lg p-2"
                      />
                    </td>

                    <td className="p-2">
                      <input
                        value={item.notes}
                        onChange={(e) =>
                          updateMedicine(
                            index,
                            "notes",
                            e.target.value
                          )
                        }
                        className="w-full bg-white/5 rounded-lg p-2"
                      />
                    </td>

                    <td className="p-2">
                      <button
                        onClick={() => removeMedicine(index)}
                        className="text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}
    </div>
  );
}