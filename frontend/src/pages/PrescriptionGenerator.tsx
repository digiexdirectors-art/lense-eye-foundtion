import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
  FileText,
  Printer,
  ArrowLeft,
  Eye,
  Plus,
  Trash2,
  Save
} from 'lucide-react';

const emptyEye = { pgvn: '', bcvn: '', nct: '', phvn: '' };
const emptyOptTest = { acd: '', pupillaryReaction: '', eom: '' };
const emptySpectacle = { sph: '', cyl: '', axis: '', va: '' };
const emptyExamination = {
  anteriorSegment: '',
  posteriorSegment: ''
};

const PrescriptionGenerator = () => {
  const { id: appointmentId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { settings } = useSettings();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  const [appointmentData, setAppointmentData] = useState<any>(null);

  const [formData, setFormData] = useState({
    chiefComplaints: '',
    generalHealth: '',
    pastHistory: '',
    rightEye: { ...emptyEye },
    leftEye: { ...emptyEye },

    optTest: {
      rightEye: { ...emptyOptTest },
      leftEye: { ...emptyOptTest }
    },

    spectaclePrescription: {
      rightEye: { ...emptySpectacle },
      leftEye: { ...emptySpectacle }
    },

    examinationFinding: {
      rightEye: { ...emptyExamination },
      leftEye: { ...emptyExamination }
    },

    diagnosis: '',
    medications: [{ name: '', description: '' }],
    comments: '',
    notes: '',
    suggestedLens: '',
    recommendations: '',
    prescriptionDate: '',
    nextReviewDate: '',
    nextReviewNote: ''
  });

  const [isPrintingSpectacle, setIsPrintingSpectacle] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        const { data } = await axios.get(
          `/api/appointments/${appointmentId}`,
          config
        );

        if (data.success) {
          setAppointmentData(data.data);

          setFormData(prev => ({
            ...prev,
            prescriptionDate:
              new Date().toISOString().split('T')[0]
          }));

          // Check if existing prescription
          try {
            const { data: rxData } = await axios.get(`/api/prescriptions/appointment/${appointmentId}`, config);
            if (rxData.success && rxData.data) {
              const rx = rxData.data;
              const formatDate = (d: any) => {
                if (!d) return '';
                const date = new Date(d);
                return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
              };

              setFormData({
                chiefComplaints: rx.chiefComplaints || '',
                generalHealth: rx.generalHealth || '',
                pastHistory: rx.pastHistory || '',
                rightEye: { ...emptyEye, ...(rx.rightEye || {}) },
                leftEye: { ...emptyEye, ...(rx.leftEye || {}) },
                optTest: {
                  rightEye: { ...emptyOptTest, ...(rx.optTest?.rightEye || {}) },
                  leftEye: { ...emptyOptTest, ...(rx.optTest?.leftEye || {}) }
                },
                spectaclePrescription: {
                  rightEye: { ...emptySpectacle, ...(rx.spectaclePrescription?.rightEye || {}) },
                  leftEye: { ...emptySpectacle, ...(rx.spectaclePrescription?.leftEye || {}) }
                },
                examinationFinding: {
                  rightEye: { ...emptyExamination, ...(rx.examinationFinding?.rightEye || {}) },
                  leftEye: { ...emptyExamination, ...(rx.examinationFinding?.leftEye || {}) }
                },
                diagnosis: rx.diagnosis || '',
                medications: rx.medications?.length > 0 ? rx.medications : [{ name: '', description: '' }],
                comments: rx.comments || '',
                notes: rx.notes || '',
                suggestedLens: rx.suggestedLens || '',
                recommendations: rx.recommendations || '',
                prescriptionDate: formatDate(rx.prescriptionDate) || new Date().toISOString().split('T')[0],
                nextReviewDate: formatDate(rx.nextReviewDate) || '',
                nextReviewNote: rx.nextReviewNote || ''
              });
              setHasExisting(true);
            }
          } catch (e) {
            console.log("No existing prescription found");
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [appointmentId, token]);

  const handleSave = async () => {
    try {
      setSaving(true);

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      await axios.post(
        '/api/prescriptions',
        {
          ...formData,
          appointmentId
        },
        config
      );

      setHasExisting(true);

      alert('Prescription Saved');
    } catch (err) {
      console.error(err);
      alert('Save Failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = (withSpectacle: boolean) => {
    setIsPrintingSpectacle(withSpectacle);
    // Short delay to allow state update if needed, though class-based print works best
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // const handleDownload = () => {
  //   window.open(
  //     `/api/prescriptions/${appointmentId}/pdf`,
  //     '_blank'
  //   );
  // };

  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [
        ...formData.medications,
        {
          name: '',
          description: ''
        }
      ]
    });
  };

  const removeMedication = (index: number) => {
    const meds = formData.medications.filter(
      (_, i) => i !== index
    );

    setFormData({
      ...formData,
      medications:
        meds.length > 0
          ? meds
          : [{ name: '', description: '' }]
    });
  };

  const updateMedication = (
    index: number,
    field: 'name' | 'description',
    value: string
  ) => {
    const meds = [...formData.medications];

    meds[index] = {
      ...meds[index],
      [field]: value
    };

    setFormData({
      ...formData,
      medications: meds
    });
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading prescription data...</div>;
  }

  if (!appointmentData) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>No appointment found.</div>;
  }

  const patient = appointmentData.patient;
  const doctor =
    user?.role === 'doctor'
      ? user
      : appointmentData.doctor;

  const docName = doctor?.name
    ? doctor.name.toLowerCase().startsWith('dr')
      ? doctor.name
      : `Dr. ${doctor.name}`
    : '';

  return (
    <>
      <style>{`
        @media print {
          *, *:before, *:after { box-sizing: border-box !important; }
          @page { 
            size: portrait; 
            margin: 0 !important; 
          }
          .print-hidden { display: none !important; }
          .section-divider { display: block !important; width: 100% !important; border: none !important; border-top: 2px solid #94a3b8 !important; margin: 0.5rem 0 0.8rem 0 !important; opacity: 1 !important; }
          html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; font-size: 9pt !important; height: 100%; overflow: visible; }
          .glass-card { box-shadow: none !important; border: none !important; padding: 15mm !important; width: 100% !important; margin: 0 !important; min-height: auto !important; }
          .form-input, textarea, input { 
            border: none !important; 
            outline: none !important; 
            background: transparent !important; 
            padding: 1px 4px !important; 
            font-size: 9pt !important; 
            font-weight: 400 !important; 
            min-height: auto !important; 
            height: auto !important; 
            line-height: 1.2 !important; 
            color: #1e293b !important;
          }
          label, b, strong, th { font-weight: 800 !important; color: #1e293b !important; font-size: 9pt !important; }
          h1 { font-size: 2.2rem !important; margin: 0 !important; font-weight: 900 !important; color: var(--primary-color) !important; }
          .prescription-logo { max-height: 150px !important; max-width: 380px !important; }
          h3 { font-size: 0.95rem !important; margin-top: 0.3rem !important; margin-bottom: 0.15rem !important; padding-bottom: 1px !important; border-bottom: none !important; color: var(--primary-color) !important; text-transform: uppercase !important; }
          .clinic-details p { line-height: 1.2 !important; margin: 0 !important; font-size: 10.5pt !important; }
          .clinic-details p.clinic-address-line { font-size: 11.5pt !important; }
          .clinic-details b, .clinic-details strong { color: #1e293b !important; }
          .examination-finding-section { margin-top: 0.8rem !important; }
          .diagnosis-container { margin-bottom: 0.6rem !important; }
          .spectacle-section-print { display: ${isPrintingSpectacle ? 'block' : 'none'} !important; margin-bottom: 0.8rem !important; border: none !important; padding: 0 !important; overflow: visible !important; }
          .spectacle-section-print div { overflow: visible !important; }
          .spectacle-section-print h3 { border-bottom: none !important; margin: 0 0 0.5rem 0 !important; padding: 0 !important; }
          .page-break-avoid { margin-bottom: 0.4rem !important; }
          table { border-collapse: collapse !important; width: 100% !important; margin-bottom: 0.15rem !important; border: none !important; }
          table, th, td { border: none !important; padding: 2px 4px !important; font-size: 8.5pt !important; background: transparent !important; }
          table thead th { background: #f8fafc !important; color: #000 !important; border: none !important; border-bottom: none !important; }
          .spectacle-section-print table { border-collapse: collapse !important; width: 100% !important; border: 1.5px solid #000 !important; }
          .spectacle-section-print table th, .spectacle-section-print table td { border: 1.5px solid #000 !important; padding: 6px 8px !important; }
          .info-grid { grid-template-columns: 1fr 1fr 1fr !important; gap: 0.2rem !important; margin-bottom: 0.3rem !important; border-bottom: none !important; padding-bottom: 2px !important; }
          .info-grid p { margin: 0 !important; line-height: 1.2 !important; color: #1e293b !important; }
          .info-grid b { min-width: 50px; display: inline-block; }
          .info-grid span.label { color: #64748b !important; font-weight: 600 !important; }
          .info-grid span.value-blue { color: var(--primary-color) !important; font-weight: 700 !important; }
          .complaints-grid { grid-template-columns: 1fr 1fr 1fr !important; gap: 0.3rem !important; margin-bottom: 0.3rem !important; }
          .medication-row { margin-top: 1px !important; gap: 2px !important; }
          .medication-row input { border-bottom: none !important; }
          .page-break-avoid { page-break-inside: avoid !important; break-inside: avoid !important; }
          .print-only { display: block !important; }
          .print-hidden { display: none !important; }
        }
        .print-only { display: none; }
      `}</style>

      <div
        className="page-header print-hidden"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}
      >
        <h2
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '1.8rem',
            fontWeight: 700
          }}
        >
          <FileText size={28} color="var(--primary-color)" />
          Clinical Prescription
        </h2>

        <div
          style={{
            display: 'flex',
            gap: '0.75rem'
          }}
        >
          <button
            className="btn-secondary small"
            onClick={() =>
              navigate('/dashboard/appointments')
            }
          >
            <ArrowLeft size={16} /> Back
          </button>

          <button
            className="btn-secondary small"
            onClick={() => handlePrint(true)}
            style={{ borderColor: '#8b5cf6', color: '#8b5cf6' }}
          >
            <Printer size={16} /> Print (With Glass)
          </button>

          <button
            className="btn-secondary small"
            onClick={() => handlePrint(false)}
            style={{ borderColor: '#ef4444', color: '#ef4444' }}
          >
            <Printer size={16} /> Print (No Glass)
          </button>

          <button
            className="btn-primary small"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={16} />
            {saving
              ? 'Saving...'
              : hasExisting
                ? 'Update'
                : 'Save'}
          </button>
        </div>
      </div>

      <div
        className="glass-card"
        style={{
          background: '#fff',
          padding: '1.5rem'
        }}
      >
        {/* Header */}
        <div
          className="prescription-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderBottom: '3px solid var(--primary-color)',
            paddingBottom: '1rem',
            marginBottom: '1.25rem',
            alignItems: 'center'
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center'
            }}
          >
            {settings.logoUrl ? (
              <img
                className="prescription-logo"
                src={settings.logoUrl}
                alt="logo"
                style={{
                  maxHeight: '150px',
                  maxWidth: '380px',
                  objectFit: 'contain'
                }}
              />
            ) : (
              <Eye size={40} color="var(--primary-color)" />
            )}

            <div>
              <h1 style={{ color: 'var(--primary-color)', margin: 0, fontSize: '2.4rem', fontWeight: 900, textTransform: 'uppercase' }}>
                {settings.clinicName}
              </h1>
              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                CLINICAL PRESCRIPTION
              </p>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>
                EYE CARE HOSPITAL
              </p>
            </div>
          </div>

          <div className="clinic-details" style={{ textAlign: 'right', fontSize: '0.92rem', color: '#1e293b', lineHeight: '1.2', fontWeight: 'bold' }}>
            <p style={{ margin: 0, fontWeight: 800, color: 'var(--primary-color)' }}>For Appointment:</p>
            <p style={{ margin: '0 0 2px 0', fontWeight: 800 }}>{settings.appointmentHours || 'Mon-Sat: 9:00AM - 6:00 PM'}</p>
            {settings.address && settings.address.split('\n').map((line: string, i: number) => (
              <p key={i} className="clinic-address-line" style={{ margin: 0, fontWeight: 800, textTransform: 'uppercase', color: '#1e293b', fontSize: '0.95rem' }}>{line}</p>
            ))}
            <p style={{ margin: '2px 0 0 0', fontWeight: 800 }}>Tel: {settings.phone}</p>
            <p style={{ margin: 0, fontWeight: 800 }}>Email: {settings.email}</p>
            {settings.gstin && <p style={{ margin: '2px 0 0 0', fontWeight: 800 }}>GSTIN: {settings.gstin}</p>}
            <p style={{ margin: '2px 0 0 0', fontWeight: 800 }}>Mob: {settings.mobile || '+91 9733035399'}</p>
          </div>
        </div>

        <div
          className="info-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1fr',
            gap: '0.75rem',
            marginBottom: '0.75rem',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '0.5rem',
            fontSize: '0.8rem'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <p><span className="label">Name:</span> <b style={{ fontSize: '1rem', color: '#111827' }}>{patient?.name}</b></p>
            <p><span className="label">Age/Sex:</span> <b>{patient?.age} / {patient?.gender}</b></p>
            <p><span className="label">MRD No:</span> <b className="value-blue" style={{ color: 'var(--primary-color)' }}>{patient?.mrdNumber}</b></p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <p><span className="label">Mobile:</span> <b>{patient?.phone}</b></p>
            <p><span className="label">Doctor:</span> <b>{docName}</b></p>
            <p><span className="label">Date:</span> <b>{formData.prescriptionDate}</b></p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <p><span className="label">Purpose:</span> <b>{patient?.purpose}</b></p>
            <p style={{ fontSize: '0.75rem', lineHeight: '1.2' }}><span className="label">Address:</span> <span>{patient?.address}</span></p>
          </div>
        </div>

        <hr className="section-divider" style={{ border: 'none', borderTop: '2px solid #94a3b8', margin: '0.5rem 0 1rem 0' }} />

        {/* Complaints */}
        <div
          className="complaints-grid"
          style={{
            display: 'grid',
            gridTemplateColumns:
              '1fr 1fr 1fr',
            gap: '1rem',
            marginBottom: '1rem'
          }}
        >
          <div>
            <label>Chief Complaints</label>

            <textarea
              className="form-input"
              rows={2}
              value={formData.chiefComplaints}
              onChange={e =>
                setFormData({
                  ...formData,
                  chiefComplaints:
                    e.target.value
                })
              }
            />
          </div>

          <div>
            <label>General Health</label>

            <textarea
              className="form-input"
              rows={2}
              value={formData.generalHealth}
              onChange={e =>
                setFormData({
                  ...formData,
                  generalHealth:
                    e.target.value
                })
              }
            />
          </div>

          <div>
            <label>Past History</label>

            <textarea
              className="form-input"
              rows={2}
              value={formData.pastHistory}
              onChange={e =>
                setFormData({
                  ...formData,
                  pastHistory:
                    e.target.value
                })
              }
            />
          </div>
        </div>

        {/* Examination */}
        <div className="page-break-avoid" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Examination</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="refraction-table-print" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <colgroup>
                <col style={{ width: '15%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '25%' }} />
              </colgroup>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '0.5rem', border: '1px solid #e2e8f0', textAlign: 'left' }}>EYE</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>PGVN</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>BCVN</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>PHVN</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>NCT</th>
                </tr>
              </thead>
              <tbody>
                {['rightEye', 'leftEye'].map((eye) => (
                  <tr key={eye}>
                    <td style={{ padding: '0.5rem', border: '1px solid #e2e8f0', fontWeight: 'bold' }}>
                      {eye === 'rightEye' ? 'Right' : 'Left'}
                    </td>
                    {['pgvn', 'bcvn', 'phvn', 'nct'].map((field) => (
                      <td key={field} style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ border: 'none', padding: '0.25rem', width: '100%' }}
                          value={(formData as any)[eye][field]}
                          onChange={(e) => setFormData({
                            ...formData,
                            [eye]: { ...(formData as any)[eye], [field]: e.target.value }
                          })}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* OPD Test */}
        <div className="page-break-avoid" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>OPD Test</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="refraction-table-print" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <colgroup>
                <col style={{ width: '15%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '40%' }} />
                <col style={{ width: '25%' }} />
              </colgroup>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '0.5rem', border: '1px solid #e2e8f0', textAlign: 'left' }}>EYE</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>ACD</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>PUPILLARY REACTION</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>EOM</th>
                </tr>
              </thead>
              <tbody>
                {['rightEye', 'leftEye'].map((eye) => (
                  <tr key={eye}>
                    <td style={{ padding: '0.5rem', border: '1px solid #e2e8f0', fontWeight: 'bold' }}>
                      {eye === 'rightEye' ? 'Right' : 'Left'}
                    </td>
                    {['acd', 'pupillaryReaction', 'eom'].map((field) => (
                      <td key={field} style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ border: 'none', padding: '0.25rem', width: '100%' }}
                          value={(formData.optTest as any)[eye][field]}
                          onChange={(e) => setFormData({
                            ...formData,
                            optTest: {
                              ...formData.optTest,
                              [eye]: { ...(formData.optTest as any)[eye], [field]: e.target.value }
                            }
                          })}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Spectacle Prescription */}
        <div className="spectacle-section-print" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Spectacle Prescription</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <colgroup>
                <col style={{ width: '15%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '25%' }} />
              </colgroup>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '0.5rem', border: '1px solid #e2e8f0', textAlign: 'left' }}>EYE</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>SPH</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>CYL</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>AXIS</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>V/A</th>
                </tr>
              </thead>
              <tbody>
                {['rightEye', 'leftEye'].map((eye) => (
                  <tr key={eye}>
                    <td style={{ padding: '0.5rem', border: '1px solid #e2e8f0', fontWeight: 'bold' }}>
                      {eye === 'rightEye' ? 'Right' : 'Left'}
                    </td>
                    {['sph', 'cyl', 'axis', 'va'].map((field) => (
                      <td key={field} style={{ padding: '0.5rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ border: 'none', padding: '0.25rem', width: '100%', textAlign: 'center' }}
                          value={(formData.spectaclePrescription as any)[eye][field]}
                          onChange={(e) => setFormData({
                            ...formData,
                            spectaclePrescription: {
                              ...formData.spectaclePrescription,
                              [eye]: { ...(formData.spectaclePrescription as any)[eye], [field]: e.target.value }
                            }
                          })}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Examination Finding */}
        <div className="page-break-avoid examination-finding-section" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Examination Finding</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="refraction-table-print" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '0.5rem', border: '1px solid #e2e8f0', textAlign: 'left' }}>EYE</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>ANTERIOR SEGMENT</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>POSTERIOR SEGMENT</th>
                </tr>
              </thead>
              <tbody>
                {['rightEye', 'leftEye'].map((eye) => (
                  <tr key={eye}>
                    <td style={{ padding: '0.5rem', border: '1px solid #e2e8f0', fontWeight: 'bold' }}>
                      {eye === 'rightEye' ? 'Right' : 'Left'}
                    </td>
                    {['anteriorSegment', 'posteriorSegment'].map((field) => (
                      <td key={field} style={{ padding: '0.5rem', border: '1px solid #e2e8f0' }}>
                        <textarea
                          className="form-input"
                          style={{ border: 'none', padding: '0.25rem', width: '100%' }}
                          rows={2}
                          value={(formData.examinationFinding as any)[eye][field]}
                          onChange={(e) => setFormData({
                            ...formData,
                            examinationFinding: {
                              ...formData.examinationFinding,
                              [eye]: { ...(formData.examinationFinding as any)[eye], [field]: e.target.value }
                            }
                          })}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="diagnosis-container" style={{ marginBottom: '1rem' }}>
          <label>Diagnosis</label>

          <textarea
            className="form-input print-hidden"
            rows={3}
            value={formData.diagnosis}
            onChange={e =>
              setFormData({
                ...formData,
                diagnosis: e.target.value
              })
            }
          />
          <div className="print-only" style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '9pt', lineHeight: 1.2, minHeight: formData.diagnosis ? 'auto' : '1rem' }}>
            {formData.diagnosis}
          </div>
        </div>

        {/* Medications */}
        <div style={{ marginBottom: '1rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%'
            }}
          >
            <label style={{ fontWeight: 'bold' }}>Medications</label>

            <button
              type="button"
              onClick={addMedication}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 1rem',
                fontSize: '0.875rem',
                background: 'var(--primary-color)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                width: 'auto',
                fontWeight: '600'
              }}
            >
              <Plus size={16} /> Add Medicine
            </button>
          </div>

          {formData.medications.map(
            (med, index) => (
              <div
                key={index}
                className="medication-row"
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginTop: '0.5rem'
                }}
              >
                <input
                  type="text"
                  className="form-input"
                  placeholder="Medicine"
                  value={med.name}
                  onChange={e =>
                    updateMedication(
                      index,
                      'name',
                      e.target.value
                    )
                  }
                />

                <input
                  type="text"
                  className="form-input"
                  placeholder="Dose"
                  value={med.description}
                  onChange={e =>
                    updateMedication(
                      index,
                      'description',
                      e.target.value
                    )
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    removeMedication(index)
                  }
                  style={{
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    padding: '0.4rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#fecaca';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#fee2e2';
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )
          )}
        </div>

        {/* Comments */}
        <div className="print-hidden" style={{ marginBottom: '1rem' }}>
          <label>Comments</label>

          <textarea
            className="form-input"
            rows={2}
            value={formData.comments}
            onChange={e =>
              setFormData({
                ...formData,
                comments: e.target.value
              })
            }
          />
        </div>

        {/* Notes */}
        <div className="print-hidden" style={{ marginBottom: '1rem' }}>
          <label>Additional Notes</label>

          <textarea
            className="form-input"
            rows={2}
            value={formData.notes}
            onChange={e =>
              setFormData({
                ...formData,
                notes: e.target.value
              })
            }
          />
        </div>

        {/* Review */}
        <div
          className="page-break-avoid"
          style={{
            marginBottom: '1rem'
          }}
        >
          {/* UI View */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }} className="review-flex-row print-hidden">
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.25rem' }}>Next Review Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.nextReviewDate}
                onChange={e =>
                  setFormData({
                    ...formData,
                    nextReviewDate: e.target.value
                  })
                }
              />
            </div>
          </div>

          {/* Print View */}
          <div className="print-only">
            {formData.nextReviewDate && (
              <>
                <h3 style={{ borderBottom: 'none', color: 'var(--primary-color)', marginBottom: '0.25rem' }}>Next Review</h3>
                <p style={{ margin: 0, fontSize: '9pt' }}>
                  <b>Date:</b> {formData.nextReviewDate}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Signature Area */}
        <div className="signature-area" style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ textAlign: 'center', width: '200px' }}>
            <div style={{ borderBottom: '1.5px solid #1e293b', marginBottom: '8px' }}></div>
            <p style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '0.85rem' }}>Optometrist</p>
          </div>
          <div style={{ textAlign: 'center', width: '220px' }}>
            <div style={{ borderBottom: '1.5px solid #1e293b', marginBottom: '8px' }}></div>
            <p style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '0.85rem' }}>{docName}</p>
            {doctor?.registrationNumber && <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>Regd No: {doctor.registrationNumber}</p>}
          </div>
        </div>
      </div>
    </>
  );
};

export default PrescriptionGenerator;